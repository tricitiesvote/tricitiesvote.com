import React from 'react';
import { Link } from 'gatsby';
import Race from './Race';

const RaceList = props => {
  const { data } = props;
  const races = [];

  data.forEach(item => {
    if (item.candidates) {
      races.push(item);
    }
  });

  return (
    <div className="races-collection" key={data.uuid}>
      {races.map(race => (
        <section className="race" key={race.uuid}>
          <Link to={`/${race.fields.slug}`}>
            <h2>{race.office.title}</h2>
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
          <Race data={race} />
        </section>
      ))}
    </div>
  );
};

export default RaceList;
