/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

export function HowToUseThisGuide() {
  return (
    <section className="howto">
      <h1>How to use this guide</h1>
      <div className="intro-container">
        <div>
          <img src="/images/compare-two.jpg" alt="Researching two candidates" />
          <h3>
            Research candidates&apos; views,
            <br /> donors, and endorsements
          </h3>
          <p>
            <strong>Nearly everything on this site is a link.</strong> Dig into
            questionnaires, interviews, forums, written endorsements, and
            Washington State PDC filings. Compare side-by-side or open a full
            profile to follow the money all the way back to the source.
          </p>
        </div>
        <div>
          <img src="/images/compare.png" alt="Comparing multiple candidates" />
          <h3>
            Quickly compare candidate
            <br /> leanings on top issues
          </h3>
          <p>
            Our issue matrix covers the topics voters tell us matter. The
            prompts are imperfect - but intentionally so - because real decisions
            rarely give you perfect options.{' '}
            <Link href="/about">Read more about our approach</Link>.
          </p>
        </div>
        <div>
          <img src="/images/comment.jpg" alt="Candidate comments" />
          <h3>
            Tap candidates&apos; faces for
            <br /> their additional comments
          </h3>
          <p>
            We invite every candidate to participate. Some decline. When that
            happens, we summarize what we can based on public statements,
            records, and input from engaged neighbors.
          </p>
        </div>
      </div>
    </section>
  )
}
