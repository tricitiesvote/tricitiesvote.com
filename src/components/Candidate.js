import React from "react"
import { graphql, Link } from "gatsby"

const Candidate = props => {
  const { id, slug, name, office, image, bioHtml, statement, email, website, facebook, twitter, instagram, youtube, pdc, lettersyesHtml, lettersnoHtml, articlesHtml } = props;
  const url = `/candidate/${slug}`;
  return (
    <div key={id}>
      <Link to={url}>
        {name}
      </Link>
      {office }
      {image}
      <div
      dangerouslySetInnerHTML={{
          __html: bioHtml,
      }}
      />
      {statement}
      {email}
      {website}
      {facebook}
      {twitter}
      {instagram}
      {youtube}
      {pdc}
      <div
      dangerouslySetInnerHTML={{
          __html: lettersyesHtml,
      }}
      />
      <div
      dangerouslySetInnerHTML={{
          __html: lettersnoHtml,
      }}
      />
      <div
      dangerouslySetInnerHTML={{
          __html: articlesHtml,
      }}
      />
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
    uuid
    hide
    bio
    bioHtml
    lettersyes
    lettersyesHtml
    lettersno
    lettersnoHtml
    articles
    articlesHtml
  }
`