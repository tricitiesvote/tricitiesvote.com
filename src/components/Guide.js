import React from 'react';
// import { Link } from "gatsby"
import RaceList from './RaceList';
import RaceListMini from './RaceListMini';

const Guide = props => {
  const { data, mini } = props;
  const { races } = data.node;

  return (
    <div className="guide" key={data.uuid}>
      {races.region ? <h1>{races.region}</h1> : ''}
      {mini ? <RaceListMini data={races} /> : <RaceList data={races} />}
    </div>
  );
};

export default Guide;
