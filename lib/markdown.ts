import { remark } from 'remark'
import html from 'remark-html'

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(html)
    .process(markdown)
  return result.toString()
}

// Synchronous version for client-side rendering
export function markdownToHtmlSync(markdown: string): string {
  const result = remark()
    .use(html)
    .processSync(markdown)
  return result.toString()
}