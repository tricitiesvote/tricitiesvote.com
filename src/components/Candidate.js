import React from "react"
import { graphql, Link } from "gatsby"

const Candidate = props => {
  // TODO: re-add { donors } and var donorsHtml
  const { id, slug, name, image, bioHtml, statement, email, website, facebook, twitter, instagram, youtube, pdc, lettersyesHtml, lettersnoHtml, articlesHtml } = props;
  const url = `/candidate/${slug}`;

  var recHtml, recno, recyes, emailHtml, websiteHtml, facebookHtml, twitterHtml, instagramHtml, youtubeHtml, pdcHtml, articlesHtmlHtml

  if (lettersyesHtml) {
    recyes = <li className="yes"
      dangerouslySetInnerHTML={{
        __html: lettersyesHtml
      }}
    ></li>
  } else {
    recyes = <li className="yes">No letters yet. <a href="https://tricitiesvote.com/letters">Write one</a>.</li>
  }

  if (lettersnoHtml) {
    recno = <li className="no"
      dangerouslySetInnerHTML={{
        __html: lettersnoHtml
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

  // no donor data yet
  // TODO need to include indicator of date updated
  // if (donors) {
  //   donorsHtml = <ul className="donors">
  //     <li title=""
  //       dangerouslySetInnerHTML={{
  //       __html: donors || ''
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

  if (articlesHtml) {
    articlesHtmlHtml =  <ul className="news">
      <li
      dangerouslySetInnerHTML={{
        __html: articlesHtml || ''
      }}
      />
    </ul>
  } else {
    articlesHtmlHtml = ''
  }

  return (
    <div className="container-candidate" key={id}>
    <div className="candidate">
      <div className="details">
        <h5>
          <Link to={url}>
            {name}
          </Link>
        </h5>
        <div className="candidate-bio" dangerouslySetInnerHTML={{
            __html: bioHtml
          }}
        />
        <p className="candidate-statement"><a href={statement}>Read full candidate statement »</a></p>
        {recHtml}
        {/* commenting out until we have donor data */}
        {/* {donorsHtml} */}
        {articlesHtmlHtml}
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
        </ul>
      </div>
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
    bioHtml
    lettersyesHtml
    lettersnoHtml
    articlesHtml
  }
`
