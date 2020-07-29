import React from 'react';
import { Link } from 'gatsby';
import CandidateMini from './CandidateMini';

const RaceListMini = props => {
  const { data } = props;

  return (
    <div className="races-collection" key={data.id}>
      {data.map(race => (
        <section className="race" key={race.uuid}>
          <Link to={`/${race.fields.slug}`}>
            <h2>{race.office.title}</h2>
          </Link>
          <div className="container-candidate container-candidate-mini">
            {race.candidates.map(candidate => (
              <CandidateMini
                name={candidate.name}
                slug={candidate.fields.slug}
                image={candidate.image}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default RaceListMini;
