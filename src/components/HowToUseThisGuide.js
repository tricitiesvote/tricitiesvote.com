import React from 'react';

const HowToUseThisGuide = () => {
  return (
    <div className="howto">
      <h1>How to use this guide</h1>
      <div className="intro-container">
        <div>
          <img src="/images/compare-two.jpg" alt="comparing two candidates" />
          <h3>
            Research candidates’ views,
            <br /> donors, and endorsements
          </h3>
          <p>
            <strong>Dang near everything on this site is a link.</strong> We’ve
            collected links to regional questionnaires, interviews, forums, and
            written endorsements, plus donor data for all Washington State PDC
            candidates. (We’ll get FEC data next time around.) You can compare
            side by side or look at each candidate and see their donor details.
            You can drill all the way down to the candidate’s PDC filing.
          </p>
        </div>
        <div>
          <img src="/images/compare.png" alt="compare all candidates" />
          <h3>
            Quickly compare candidate
            <br /> leanings on top issues
          </h3>
          <p>
            Our A/B questionnaire is based on top issues identified over recent
            years by the public and candidates themselves. Our process is
            imperfect, but it’s intended to be nonpartisan and impartial while
            mirroring the messiness of being an elected official and a voter,
            where nearly all decisions are choices between two options you
            didn’t come up with.{' '}
            <a href="/about">Read more about our approach</a>.
          </p>
        </div>
        <div>
          <img
            src="/images/comment.jpg"
            alt="additional comments from candidates"
          />
          <h3>
            Click candidates‘ faces for
            <br /> their additional comments
          </h3>
          <p>
            We painstakingly worked to encourage all candidates to participate.
            Our process is rigorous and some chose not to.
          </p>
          <p>
            In some cases, we have done our best to speculate on the positions
            of candidates who did not answer to the best of our ability based on
            comments, traditional party positions, publicly available
            information, and input from engaged citizens.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowToUseThisGuide;
