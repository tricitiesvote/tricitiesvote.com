import React from "react"
import { graphql, Link } from "gatsby"

const CandidateMini = props => {

  const { 
    data
  } = props;

  // const { slug } = fields
  // const url = `/${slug}`;

  return (
    <div className="candidate">
      <pre><code>hi
        {JSON.stringify(data,null,2)}
      </code></pre>
      {/* <Link to={url}>
        <img src={image} alt={name} />
      </Link> */}
      {data.forEach(candidate =>
        <div className="candidate-mini">
          <img src={candidate.image} />
        </div>
      )}
    </div>
  );
};

export default CandidateMini

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
    lettersyes
    lettersno
    articles
  }
`
