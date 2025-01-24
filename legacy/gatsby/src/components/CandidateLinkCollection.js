import React from 'react';
import CandidateLink from './CandidateLink';

const CandidateLinkCollection = props => {
  const {
    email,
    website,
    facebook,
    twitter,
    instagram,
    youtube,
    pdc,
    notes,
  } = props;

  return (
    <ul className="candidate-links">
      {email ? (
        <CandidateLink
          title="Email"
          link={`mailto:${email}`}
          emoji="📩"
          emojilabel="email"
        />
      ) : (
        ''
      )}
      {website ? (
        <CandidateLink
          title="Website"
          link={website}
          emoji="🌐"
          emojilabel="link"
        />
      ) : (
        ''
      )}
      {facebook ? (
        <CandidateLink
          title="Facebook"
          link={facebook}
          emoji="👤"
          emojilabel="facebook"
        />
      ) : (
        ''
      )}
      {twitter ? (
        <CandidateLink
          title="Twitter"
          link={twitter}
          emoji="🐦"
          emojilabel="twitter"
        />
      ) : (
        ''
      )}
      {instagram ? (
        <CandidateLink
          title="Instagram"
          link={instagram}
          emoji="📷"
          emojilabel="instagram"
        />
      ) : (
        ''
      )}
      {youtube ? (
        <CandidateLink
          title="YouTube"
          link={youtube}
          emoji="📺"
          emojilabel="youtube"
        />
      ) : (
        ''
      )}
      {pdc ? (
        <CandidateLink
          title="Finance"
          link={pdc}
          emoji="💰"
          emojilabel="finance"
        />
      ) : (
        ''
      )}
      {notes ? (
        <CandidateLink
          title="Rough notes"
          link={notes}
          emoji="📓"
          emojilabel="nootebook"
        />
      ) : (
        ''
      )}
    </ul>
  );
};

export default CandidateLinkCollection;
