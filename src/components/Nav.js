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
          <Link to="/benton">Benton</Link>
          <Link to="/franklin">Franklin</Link>
        </nav>
      )}
    />
  );
};

export default Nav;
