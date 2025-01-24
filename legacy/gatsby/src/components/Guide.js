import React from 'react';
// import { Link } from "gatsby"
import _ from 'lodash';
import RaceList from './RaceList';
import RaceListMini from './RaceListMini';

const Guide = props => {
  const { data, mini } = props;
  const { races } = data.node;
  // const flattened = _.flatten(races);
  const flattened = _.flattenDepth(races, 1);
  const dedupedRaces = _.uniqBy(flattened, 'fields.slug');

  return (
    <div className="guide" key={data.uuid}>
      {/* <pre>
        <code>{JSON.stringify(dedupedRaces, null, 2)}</code>
      </pre> */}
      {dedupedRaces.region ? <h1>{dedupedRaces.region}</h1> : ''}
      {mini ? (
        <RaceListMini data={dedupedRaces} />
      ) : (
        <RaceList data={dedupedRaces} />
      )}
    </div>
  );
};

export default Guide;
