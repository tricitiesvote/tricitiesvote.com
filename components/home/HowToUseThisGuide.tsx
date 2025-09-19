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
            Washington State PDC filings and donor data.
          </p>
        </div>
        <div>
          <img src="/images/compare.png" alt="Comparing multiple candidates" />
          <h3>
            Quickly compare candidate
            <br /> leanings on top issues
          </h3>
          <p>
            Our issue matrix is based on real issues candidates will face—not 
            talking points. The prompts have imperfect tradeoffs because real decisions
            rarely give you perfect options.{' '}
          </p>
        </div>
        <div>
          <img src="/images/comment.jpg" alt="Candidate comments" />
          <h3>
            Tap candidates&apos; faces for
            <br /> their additional comments
          </h3>
          <p>
            We invite every candidate to participate and we give them the chance to 
            add additional comments to explain their positions.
          </p>
        </div>
      </div>
    </section>
  )
}
