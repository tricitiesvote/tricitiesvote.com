import React from 'react';
import { graphql, Link } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
// import Candidate from '../components/Candidate';
import ContactInline from '../components/ContactInline';

const NotesPage = ({ data }) => {
  // const { edges } = data
  const { allNotesJson } = data;
  const note = allNotesJson.edges[0].node;

  return (
    <DefaultLayout>
      <p className="notes-note">
        <em>
          We use this page to collect quotes, rough notes, and extra links for
          our own purposes
        </em>
      </p>
      <div className="container-candidate">
        <div className="candidate" key={note.candidate.uuid}>
          {/* <pre><code>{JSON.stringify(props,null,2)}</code></pre> */}
          <div className="details">
            <h5>
              <Link to={`/${note.candidate.fields.slug}`}>
                {note.candidate.name}
              </Link>
            </h5>
            <div
              className="notes"
              dangerouslySetInnerHTML={{
                __html: note.fields.notes_html,
              }}
            />
          </div>
          <div className="info">
            <img src={note.candidate.image} alt={note.candidate.name} />
          </div>
        </div>
      </div>
      <ContactInline
        page={`https://tricitiesvote.com/${note.candidate.fields.slug}/notes`}
      />
    </DefaultLayout>
  );
};

export default NotesPage;

export const pageQuery = graphql`
  query($slug: String!) {
    allNotesJson(filter: { candidate: { fields: { slug: { eq: $slug } } } }) {
      edges {
        node {
          fields {
            notes_html
          }
          candidate {
            name
            office {
              ...OfficeDetails
            }
            image
            fields {
              slug
            }
          }
        }
      }
    }
  }
`;
