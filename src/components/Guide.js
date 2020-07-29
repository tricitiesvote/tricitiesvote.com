import React from 'react';
// import { Link } from "gatsby"
import RaceList from './RaceList';

const Guide = props => {
  const { data } = props;
  const { races } = data.node;

  return (
    <div className="guide" key={data.uuid}>
      {races.region ? <h1>{races.region}</h1> : ''}
      <RaceList data={races} />
    </div>
  );
};

export default Guide;
