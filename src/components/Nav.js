import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

const Nav = () => {
  return (
    <StaticQuery
      query={graphql`
        query {
          allGuidesJson(
            filter: { electionyear: { eq: "2020" }, type: { eq: "general" } }
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
          <Link to="/compare-legislators">Legislators</Link>
          <Link to="/compare-commissioners">Commissioners</Link>
        </nav>
      )}
    />
  );
};

export default Nav;
