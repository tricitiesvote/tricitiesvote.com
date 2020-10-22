import React from 'react';
import { Link } from 'gatsby';
import _ from 'lodash';
import CandidateMini from './CandidateMini';

const RaceListMini = props => {
  const { data } = props;
  console.log('racelistmini data', data);

  // (!_.find(races { office}, { office: { title: race.office.title } })

  return (
    <div className="races-collection">
      {data.map(race => (
        <section className="race" key={race.node.id}>
          <Link to={`/${race.node.fields.slug}`}>
            <h2>{race.node.office.title}</h2>
            <span className="note">🟡 🟢 Compare candidates »</span>
          </Link>
          <div className="container-candidate container-candidate-mini">
            {race.node.candidates.map(candidate => (
              <CandidateMini
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
