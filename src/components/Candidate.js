import React from "react"
import { graphql, Link } from "gatsby"

const Candidate = props => {
  // TODO: re-add { donors } and var donorsHtml
  const { 
    id, 
    name, 
    image, 
    statement, 
    email, 
    website, 
    facebook, 
    twitter, 
    instagram, 
    youtube, 
    pdc, 
    fields 
  } = props.data;
  const { 
    bio_html, 
    body_html, 
    donors_html_nowrap,
    lettersyes_html_nowrap, 
    lettersno_html_nowrap, 
    articles_html_nowrap 
  } = fields
  const url = `/${fields.slug}`;

  var donorsHtml, recHtml, recno, recyes, emailHtml, websiteHtml, facebookHtml, twitterHtml, instagramHtml, youtubeHtml, pdcHtml, articlesHtml

  if (lettersyes_html_nowrap) {
    recyes = <li className="yes"
      dangerouslySetInnerHTML={{
        __html: lettersyes_html_nowrap
      }}
    ></li>
  } else {
    recyes = <li className="yes">No letters yet. <a href="https://tricitiesvote.com/letters">Write one</a>.</li>
  }

  if (lettersno_html_nowrap) {
    recno = <li className="no"
      dangerouslySetInnerHTML={{
        __html: lettersno_html_nowrap
      }}
    ></li>
  } else {
    recno = ''
  }

  if (recyes || recno) {
    recHtml = <ul className="recs">
      {recyes}
      {recno}
    </ul>
  } else {
    recHtml = ''
  }

  // TODO need to include indicator of date updated
  if (donors_html_nowrap) {
    donorsHtml = <ul className="donors">
      <li title=""
        dangerouslySetInnerHTML={{
        __html: donors_html_nowrap || ''
      }}
      ></li>
    </ul>
  } else {
    donorsHtml = <ul className="donors">
    <li title="">
      <span>Candidate is a mini-filer raising less than the statutory requirements for public reporting.</span>
    </li>
  </ul>
  }

  if (email) {
    emailHtml = <li>
      <span role="img" aria-label="email">📩</span> 
      <a href={email}>Email</a>
    </li>
  } else {
    emailHtml = ''
  }

  if (website) {
    websiteHtml = <li>
      <span role="img" aria-label="link">🌐</span> 
      <a href={website}>Website</a>
    </li>
  } else {
    websiteHtml = ''
  }

  if (facebook) {
    facebookHtml = <li>
      <span role="img" aria-label="facebook">👤</span> 
      <a href={facebook}>Facebook</a>
    </li>
  } else {
    facebookHtml = ''
  }
  if (twitter) {
    twitterHtml = <li>
      <span role="img" aria-label="twitter">🐦</span> 
      <a href={twitter}>Twitter</a>
    </li>
  } else {
    twitterHtml = ''
  }

  if (youtube) {
    youtubeHtml = <li>
      <span role="img" aria-label="youtube">📺</span> 
      <a href={youtube}>YouTube</a>
    </li>
  } else {
    youtubeHtml = ''
  }

  if (instagram) {
    instagramHtml = <li>
      <span role="img" aria-label="instagram">📷</span> 
      <a href={instagram}>Instagram</a>
    </li>
  } else {
    instagramHtml = ''
  }

  if (pdc) {
    pdcHtml = <li>
      <span role="img" aria-label="finance">💰</span> 
      <a href={pdc}>Finance</a>
    </li>
  } else {
    pdcHtml = ''
  }

  if (articles_html_nowrap) {
    articlesHtml =  <ul className="news">
      <li
      dangerouslySetInnerHTML={{
        __html: articles_html_nowrap || ''
      }}
      />
    </ul>
  } else {
    articlesHtml = ''
  }

  return (
    <div className="candidate" key={id}>
      {/* <pre><code>{JSON.stringify(props,null,2)}</code></pre> */}
      <div className="details">
        <h5>
          <Link to={url}>
            {name}
          </Link>
        </h5>
        <div className="candidate-bio" dangerouslySetInnerHTML={{
            __html: bio_html
          }}
        />
        <p className="candidate-statement"><a href={statement}>Read full candidate statement »</a></p>
        <div dangerouslySetInnerHTML={{
            __html: body_html
          }}
        />
        {recHtml}
        {/* commenting out until we have donors data */}
        {/* {donorsHtml} */}
        {articlesHtml}
      </div>
      <div className="info">
        <img src={image} alt={name} />
        <ul>
          {emailHtml}
          {websiteHtml}
          {facebookHtml}
          {twitterHtml}
          {instagramHtml}
          {youtubeHtml}
          {pdcHtml}
          <li className="rough-notes">
            <span role="img" aria-label="notebook">📓</span> 
            <Link to={url + '/notes'}>
              Rough notes
            </Link>
          </li>
          
        </ul>
      </div>
    </div>


  );
};

export default Candidate

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
      donors_html
      lettersyes_html
      lettersno_html
      articles_html
      donors_html_nowrap
      lettersyes_html_nowrap
      lettersno_html_nowrap 
      bio_html_nowrap       
      articles_html_nowrap  
      body_html_nowrap   
    }
    office {
      ...OfficeDetails
    }
    electionyear  
    name
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
    pdc
    donors
    uuid
    hide
    bio
    donors
    lettersyes
    lettersno
    articles
  }
`
