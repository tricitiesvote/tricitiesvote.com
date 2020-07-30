import React from 'react';
import { Link } from 'gatsby';
import _ from 'lodash';
import CandidateMini from './CandidateMini';

const RaceListMini = props => {
  const { data } = props;

  const races = [];

  data.forEach(race => {
    // eslint-disable-next-line prettier/prettier
    if (!_.find(races, race)) {
      races.push(race);
    }
  });

  // (!_.find(races { office}, { office: { title: race.office.title } })

  return (
    <div className="races-collection" key={data.id}>
      <pre>{/* <code>{JSON.stringify(races[1], null, 2)}</code> */}</pre>
      {races.map(race => (
        <section className="race" key={race.id}>
          <Link to={`/${race.fields.slug}`}>
            <h2>{race.office.title}</h2>
            <span className="note">See more details »</span>
          </Link>
          <div className="container-candidate container-candidate-mini">
            {race.candidates.map(candidate => (
              <CandidateMini
                name={candidate.name}
                slug={candidate.fields.slug}
                image={candidate.image}
                engagement={candidate.fields.engagement_html}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default RaceListMini;
