import React from 'react';
import { graphql, Link } from 'gatsby';

const Candidate = props => {
  // TODO: re-add { donors } and var donorsHtml
  const { fullsize } = props;
  const { data } = props;
  const {
    id,
    name,
    image,
    email,
    website,
    facebook,
    twitter,
    instagram,
    youtube,
    pdc_url,
    fields,
  } = data;
  const {
    bio_html,
    body_html,
    statement_html,
    statement_excerpt_html,
    lettersyes_html_nowrap,
    lettersno_html_nowrap,
    articles_html_nowrap,
  } = fields;
  const url = `/${fields.slug}`;

  let bioHtml;
  let recHtml;
  let recno;
  let recyes;
  let emailHtml;
  let websiteHtml;
  let facebookHtml;
  let twitterHtml;
  let instagramHtml;
  let youtubeHtml;
  let pdcHtml;
  let articlesHtml;

  if (lettersyes_html_nowrap) {
    recyes = (
      <li
        className="yes"
        dangerouslySetInnerHTML={{
          __html: lettersyes_html_nowrap,
        }}
      />
    );
  } else {
    recyes = (
      <li className="yes">
        No letters yet.{' '}
        <a href="https://tricitiesvote.com/letters">Write one</a>.
      </li>
    );
  }

  if (lettersno_html_nowrap) {
    recno = (
      <li
        className="no"
        dangerouslySetInnerHTML={{
          __html: lettersno_html_nowrap,
        }}
      />
    );
  } else {
    recno = '';
  }

  if (recyes || recno) {
    recHtml = (
      <ul className="recs">
        {recyes}
        {recno}
      </ul>
    );
  } else {
    recHtml = '';
  }

  // // TODO need to include indicator of date updated
  // if (donors_html_nowrap) {
  //   donorsHtml = <ul className="donors">
  //     <li title=""
  //       dangerouslySetInnerHTML={{
  //       __html: donors_html_nowrap || ''
  //     }}
  //     ></li>
  //   </ul>
  // } else {
  //   donorsHtml = <ul className="donors">
  //   <li title="">
  //     <span>Candidate is a mini-filer raising less than the statutory requirements for public reporting.</span>
  //   </li>
  // </ul>
  // }

  if (email) {
    emailHtml = (
      <li>
        <span role="img" aria-label="email">
          📩
        </span>
        <a href={`mailto:${email}`}>Email</a>
      </li>
    );
  } else {
    emailHtml = '';
  }

  if (bio_html) {
    bioHtml = (
      <div
        className="candidate-bio"
        dangerouslySetInnerHTML={{
          __html: bio_html,
        }}
      />
    );
  } else if (!fullsize && statement_excerpt_html) {
    bioHtml = (
      <div className="candidate-bio excerpt">
        <div
          dangerouslySetInnerHTML={{
            __html: statement_excerpt_html,
          }}
        />
        <Link className="candidate-link" to={url}>
          More »
        </Link>
      </div>
    );
  } else if (fullsize && statement_html) {
    bioHtml = (
      <div
        className="candidate-bio"
        dangerouslySetInnerHTML={{
          __html: statement_html,
        }}
      />
    );
  } else if (!bio_html && !statement_html) {
    bioHtml = (
      <div className="candidate-bio">
        <p>No candidate statement</p>
      </div>
    );
  }

  // TODO: add pamphlet_url

  if (website) {
    websiteHtml = (
      <li>
        <span role="img" aria-label="link">
          🌐
        </span>
        <a href={website}>Website</a>
      </li>
    );
  } else {
    websiteHtml = '';
  }

  if (facebook) {
    facebookHtml = (
      <li>
        <span role="img" aria-label="facebook">
          👤
        </span>
        <a href={facebook}>Facebook</a>
      </li>
    );
  } else {
    facebookHtml = '';
  }
  if (twitter) {
    twitterHtml = (
      <li>
        <span role="img" aria-label="twitter">
          🐦
        </span>
        <a href={twitter}>Twitter</a>
      </li>
    );
  } else {
    twitterHtml = '';
  }

  if (youtube) {
    youtubeHtml = (
      <li>
        <span role="img" aria-label="youtube">
          📺
        </span>
        <a href={youtube}>YouTube</a>
      </li>
    );
  } else {
    youtubeHtml = '';
  }

  if (instagram) {
    instagramHtml = (
      <li>
        <span role="img" aria-label="instagram">
          📷
        </span>
        <a href={instagram}>Instagram</a>
      </li>
    );
  } else {
    instagramHtml = '';
  }

  if (pdc_url) {
    pdcHtml = (
      <li>
        <span role="img" aria-label="finance">
          💰
        </span>
        <a href={pdc_url}>Finance</a>
      </li>
    );
  } else {
    pdcHtml = '';
  }

  if (articles_html_nowrap) {
    articlesHtml = (
      <ul className="news">
        <li
          dangerouslySetInnerHTML={{
            __html: articles_html_nowrap || '',
          }}
        />
      </ul>
    );
  } else {
    articlesHtml = '';
  }

  return (
    <div className="candidate" key={id}>
      {/* <pre><code>{JSON.stringify(props,null,2)}</code></pre> */}
      <div className="details">
        <h5>
          <Link to={url}>{name}</Link>
        </h5>
        {bioHtml}
        <div
          className="candidate-body"
          dangerouslySetInnerHTML={{
            __html: body_html,
          }}
        />
        {recHtml}
        {/* commenting out until we have donors data */}
        {/* {donorsHtml} */}
        {articlesHtml}
      </div>
      <div className="info">
        <Link to={url}>
          <img src={image} alt={name} />
        </Link>
        <ul>
          {emailHtml}
          {websiteHtml}
          {facebookHtml}
          {twitterHtml}
          {instagramHtml}
          {youtubeHtml}
          {pdcHtml}
          {/* <li className="rough-notes">
            <span role="img" aria-label="notebook">📓</span> 
            <Link to={url + '/notes'}>
              Rough notes
            </Link>
          </li> */}
        </ul>
      </div>
    </div>
  );
};

export default Candidate;

export const pageQuery = graphql`
  fragment OfficeDetails on OfficesJson {
    title
    job
    position
    region
    uuid
  }

  fragment CandidateDetails on CandidatesJson {
    fields {
      slug
      body_html
      bio_html
      lettersyes_html
      lettersno_html
      articles_html
      statement_html
      statement_excerpt_html
      body_excerpt_html
      bio_excerpt_html
      lettersyes_html_nowrap
      lettersno_html_nowrap
      bio_html_nowrap
      articles_html_nowrap
      body_html_nowrap
    }
    name
    electionyear
    office {
      ...OfficeDetails
    }
    party
    incumbent
    yearsin
    image
    statement
    email
    website
    facebook
    twitter
    instagram
    youtube
    pdc_url
    pamphlet_url
    bio
    lettersyes
    lettersno
    articles
    uuid
    hide
  }
`;
