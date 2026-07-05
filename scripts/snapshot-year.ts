/**
 * Snapshot the live site into a static archive for a given election year.
 *
 * Usage:
 *   npm run snapshot -- 2025 [--base https://tricitiesvote.com] [--out tmp/snapshot/2025]
 *                            [--no-push] [--no-deploy]
 *
 * Steps:
 *   1. Crawl the site (same-origin pages + assets) into a local directory,
 *      rewriting /_next/image URLs to plain image files so nothing depends
 *      on a running server.
 *   2. Commit the directory to an orphan git branch named after the year
 *      and push it to origin (durable archival copy).
 *   3. Deploy the directory to Vercel as project `<year>-tricitiesvote`,
 *      giving a stable <year>-tricitiesvote.vercel.app domain that DNS for
 *      <year>.tricitiesvote.com can point at.
 */
import * as cheerio from 'cheerio'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

interface Options {
  year: number
  base: string
  out: string
  push: boolean
  deploy: boolean
  limit: number
}

const SKIP_PATH_PREFIXES = [
  '/api/',
  '/login',
  '/moderate',
  '/admin',
  '/edits',
  '/debug'
]

const HTML_EXTENSIONLESS = /\.[a-z0-9]{2,5}$/i

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const opts: Options = {
    year: 0,
    base: 'https://tricitiesvote.com',
    out: '',
    push: true,
    deploy: true,
    limit: 5000
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--base') opts.base = args[++i]
    else if (a === '--out') opts.out = args[++i]
    else if (a === '--no-push') opts.push = false
    else if (a === '--no-deploy') opts.deploy = false
    else if (a === '--limit') opts.limit = parseInt(args[++i], 10)
    else if (/^\d{4}$/.test(a)) opts.year = parseInt(a, 10)
  }
  if (!opts.year) {
    console.error('Usage: npm run snapshot -- <year> [--base url] [--out dir] [--no-push] [--no-deploy]')
    process.exit(1)
  }
  opts.base = opts.base.replace(/\/$/, '')
  if (!opts.out) opts.out = path.join('tmp', 'snapshot', String(opts.year))
  return opts
}

function shouldSkipPath(p: string): boolean {
  if (SKIP_PATH_PREFIXES.some(prefix => p === prefix.replace(/\/$/, '') || p.startsWith(prefix))) {
    return true
  }
  // candidate wiki edit pages
  if (/\/edit\/?$/.test(p)) return true
  // /og/* HTML template routes (the .png share cards under /og are fine)
  if (p.startsWith('/og') && !HTML_EXTENSIONLESS.test(p)) return true
  return false
}

/** Resolve an href/src against the site origin; return a root-relative path or null if external. */
function toLocalPath(ref: string, base: string, fromPath: string): string | null {
  if (!ref) return null
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(ref)) return null
  let url: URL
  try {
    url = new URL(ref, base + fromPath)
  } catch {
    return null
  }
  const origin = new URL(base)
  const sameHost =
    url.host === origin.host || url.host === `www.${origin.host}` || `www.${url.host}` === origin.host
  if (!sameHost) return null
  return url.pathname
}

function outputPathFor(dir: string, urlPath: string, isHtml: boolean): string {
  const clean = decodeURIComponent(urlPath).replace(/\/+$/, '') || '/'
  if (isHtml && !HTML_EXTENSIONLESS.test(clean)) {
    return path.join(dir, clean === '/' ? '' : clean, 'index.html')
  }
  return path.join(dir, clean)
}

async function crawl(opts: Options) {
  const queue: string[] = ['/']
  const seen = new Set<string>(['/'])
  const externalImages = new Map<string, string>() // remote url -> local /_ext path
  let pages = 0
  let assets = 0
  let failures = 0

  const enqueue = (p: string | null) => {
    if (!p) return
    const norm = p.replace(/\/+$/, '') || '/'
    if (seen.has(norm) || shouldSkipPath(norm)) return
    seen.add(norm)
    queue.push(norm)
  }

  /** Rewrite a /_next/image?url=... reference to a plain image path. */
  const resolveNextImage = async (ref: string): Promise<string | null> => {
    let url: URL
    try {
      url = new URL(ref, opts.base)
    } catch {
      return null
    }
    const inner = url.searchParams.get('url')
    if (!inner) return null
    if (inner.startsWith('/')) {
      enqueue(inner)
      return inner
    }
    // Remote image: download into /_ext so the archive is self-contained.
    if (externalImages.has(inner)) return externalImages.get(inner)!
    try {
      const res = await fetch(inner)
      if (!res.ok) throw new Error(String(res.status))
      const buf = Buffer.from(await res.arrayBuffer())
      const ext = path.extname(new URL(inner).pathname) || '.img'
      const local = `/_ext/${createHash('sha1').update(inner).digest('hex').slice(0, 16)}${ext}`
      const file = path.join(opts.out, local)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, buf)
      externalImages.set(inner, local)
      return local
    } catch {
      externalImages.set(inner, inner)
      return inner // fall back to hotlinking
    }
  }

  const processHtml = async (pagePath: string, html: string): Promise<string> => {
    const $ = cheerio.load(html)

    const rewriteAttr = async (el: any, attr: string) => {
      const val = $(el).attr(attr)
      if (!val) return
      if (val.includes('/_next/image')) {
        const plain = await resolveNextImage(val)
        if (plain) {
          $(el).attr(attr, plain)
          $(el).removeAttr('srcset')
          $(el).removeAttr('sizes')
        }
        return
      }
      const local = toLocalPath(val, opts.base, pagePath)
      if (local) {
        $(el).attr(attr, local)
        enqueue(local)
      }
    }

    for (const el of $('a[href], link[href]').toArray()) {
      await rewriteAttr(el, 'href')
    }
    for (const el of $('script[src], img[src], source[src], video[src], audio[src]').toArray()) {
      await rewriteAttr(el, 'src')
    }
    for (const el of $('img[srcset], source[srcset]').toArray()) {
      const srcset = $(el).attr('srcset')!
      if (srcset.includes('/_next/image')) {
        $(el).removeAttr('srcset')
        $(el).removeAttr('sizes')
      } else {
        srcset.split(',').forEach(part => {
          enqueue(toLocalPath(part.trim().split(/\s+/)[0], opts.base, pagePath))
        })
      }
    }

    // Preload/prefetch chunks referenced only in inline flight data or JS
    const nextRefs = html.match(/\/_next\/static\/[A-Za-z0-9_\-./%]+/g) || []
    nextRefs.forEach(ref => enqueue(ref))

    return $.html()
  }

  let active = 0
  const worker = async () => {
    while (seen.size <= opts.limit) {
      if (queue.length === 0) {
        if (active === 0) return
        await new Promise(r => setTimeout(r, 100))
        continue
      }
      const p = queue.shift()!
      active++
      try {
        await fetchOne(p)
      } finally {
        active--
      }
    }
  }

  const fetchOne = async (p: string) => {
    let res: Response
    try {
      res = await fetch(opts.base + p, { redirect: 'follow' })
    } catch (err) {
      failures++
      console.warn(`  ! fetch failed ${p}: ${err}`)
      return
    }
    if ([301, 302, 307, 308].includes(res.status)) {
      // Statically-prerendered Next.js redirect() pages return 3xx with no
      // Location header; the target only exists in the embedded flight data.
      const body = await res.text()
      const target = (body.match(/\/(?:19|20)\d{2}\/[A-Za-z0-9/_-]+/) || [])[0]
      if (target) {
        const file = outputPathFor(opts.out, p, true)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(
          file,
          `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${target}">` +
            `<link rel="canonical" href="${target}"></head>` +
            `<body><a href="${target}">Redirecting…</a></body></html>\n`
        )
        enqueue(target)
        pages++
        return
      }
      failures++
      console.warn(`  ! ${res.status} ${p} (no redirect target found)`)
      return
    }
    if (!res.ok) {
      failures++
      console.warn(`  ! ${res.status} ${p}`)
      return
    }
    const type = res.headers.get('content-type') || ''
    if (type.includes('text/html')) {
      const html = await res.text()
      const rewritten = await processHtml(p, html)
      const file = outputPathFor(opts.out, p, true)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, rewritten)
      pages++
      if (pages % 25 === 0) console.log(`  ${pages} pages, ${assets} assets, ${queue.length} queued`)
    } else {
      const buf = Buffer.from(await res.arrayBuffer())
      const file = outputPathFor(opts.out, p, false)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, buf)
      assets++
      if (type.includes('text/css')) {
        const css = buf.toString('utf8')
        const urls = css.match(/url\(([^)]+)\)/g) || []
        urls.forEach(u => {
          const raw = u.slice(4, -1).replace(/["']/g, '')
          enqueue(toLocalPath(raw, opts.base, p))
        })
      }
    }
  }

  // Modest parallelism; queue/seen are shared so workers cooperate.
  await Promise.all(Array.from({ length: 6 }, worker))
  console.log(`Crawl done: ${pages} pages, ${assets} assets, ${failures} failures`)
  if (pages === 0) {
    throw new Error('No pages captured — is the base URL right?')
  }
}

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function pushToBranch(opts: Options) {
  const branch = String(opts.year)
  const worktree = path.join('tmp', 'snapshot', `worktree-${branch}`)
  console.log(`\nCommitting snapshot to branch "${branch}"...`)

  fs.rmSync(worktree, { recursive: true, force: true })
  try {
    git(['worktree', 'remove', '--force', worktree])
  } catch {
    /* no stale worktree */
  }

  const remoteBranches = git(['ls-remote', '--heads', 'origin', branch])
  if (remoteBranches) {
    git(['fetch', 'origin', `${branch}:refs/remotes/origin/${branch}`])
    git(['worktree', 'add', worktree, '-B', branch, `origin/${branch}`])
    // Replace contents (keep .git file that marks the worktree)
    for (const entry of fs.readdirSync(worktree)) {
      if (entry !== '.git') fs.rmSync(path.join(worktree, entry), { recursive: true, force: true })
    }
  } else {
    git(['worktree', 'add', '--orphan', '-b', branch, worktree])
  }

  fs.cpSync(opts.out, worktree, { recursive: true })
  git(['add', '-A'], worktree)
  const status = git(['status', '--porcelain'], worktree)
  if (status) {
    git(['commit', '-m', `static snapshot of ${opts.year} site`], worktree)
    git(['push', '-u', 'origin', branch], worktree)
    console.log(`Pushed branch "${branch}" to origin.`)
  } else {
    console.log('No changes since last snapshot; nothing to push.')
  }
  git(['worktree', 'remove', '--force', worktree])
}

function deployToVercel(opts: Options) {
  const project = `${opts.year}-tricitiesvote`
  console.log(`\nDeploying to Vercel project "${project}"...`)
  try {
    execFileSync('npx', ['vercel', 'whoami'], { encoding: 'utf8', stdio: 'pipe' })
  } catch {
    console.error(
      `Vercel CLI is not authenticated. Run:\n` +
        `  npx vercel login\n` +
        `  npx vercel link --yes --cwd ${opts.out} --project ${project}\n` +
        `  npx vercel deploy --prod --yes --cwd ${opts.out}`
    )
    return
  }
  execFileSync('npx', ['vercel', 'link', '--yes', '--cwd', opts.out, '--project', project], {
    stdio: 'inherit'
  })
  execFileSync('npx', ['vercel', 'deploy', '--prod', '--yes', '--cwd', opts.out], {
    stdio: 'inherit'
  })
  console.log(`Deployed. Stable domain: https://${project}.vercel.app`)
  console.log(`Point ${opts.year}.tricitiesvote.com DNS (CNAME) at that Vercel project when ready.`)
}

async function main() {
  const opts = parseArgs()
  console.log(`Snapshotting ${opts.base} (year ${opts.year}) into ${opts.out}\n`)
  fs.rmSync(opts.out, { recursive: true, force: true })
  fs.mkdirSync(opts.out, { recursive: true })

  await crawl(opts)

  // Static hosting config: serve <path>/index.html for extensionless URLs.
  fs.writeFileSync(
    path.join(opts.out, 'vercel.json'),
    JSON.stringify({ trailingSlash: false }, null, 2)
  )

  if (opts.push) pushToBranch(opts)
  else console.log('\nSkipping branch push (--no-push).')

  if (opts.deploy) deployToVercel(opts)
  else console.log('Skipping Vercel deploy (--no-deploy).')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
