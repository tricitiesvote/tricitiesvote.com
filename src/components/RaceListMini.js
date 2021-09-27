import React from 'react';
import { Link } from 'gatsby';
import CandidateMini from './CandidateMini';

const RaceListMini = props => {
  const { data } = props;

  const selectedRaces = [];

  data.forEach(item => {
    console.log('item', item.node.candidates.length);
    if (item.node.candidates.length === 2) {
      selectedRaces.push(item);
    }
  });

  // (!_.find(races { office}, { office: { title: race.office.title } })

  return (
    <div className="races-collection">
      {selectedRaces.map(race => (
        <section className="race" key={race.node.id}>
          <Link to={`/${race.node.fields.slug}`}>
            <h2>{race.node.office.title}</h2>
            <span className="note">
              <span role="img" aria-label="yellow-dot">
                🟡
              </span>{' '}
              <span role="img" aria-label="green-dot">
                🟢
              </span>{' '}
              Compare candidates »
            </span>
          </Link>
          <div className="container-candidate container-candidate-mini">
            {race.node.candidates.map(candidate => (
              <CandidateMini
                key={candidate.uuid}
                name={candidate.name}
                slug={candidate.fields.slug}
                image={candidate.image}
                engagement={candidate.fields.engagement_html}
                fundraising={candidate.fields.fundraising}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default RaceListMini;
