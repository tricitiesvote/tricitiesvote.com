import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

const Nav = () => {
  return (
    <StaticQuery
      query={graphql`
        query {
          allGuidesJson(
            filter: { electionyear: { eq: "2020" }, type: { eq: "primary" } }
          ) {
            edges {
              node {
                fields {
                  slug
                }
                electionyear
                type
                region
              }
            }
          }
        }
      `}
      render={data => (
        <nav>
          <Link to="/">Home</Link>
          {data.allGuidesJson.edges.map(guide => (
            <Link to={`/${guide.node.fields.slug}`}>{guide.node.region}</Link>
          ))}
          <Link to="#feedback">Feedback</Link>
        </nav>
      )}
    />
  );
};

export default Nav;
