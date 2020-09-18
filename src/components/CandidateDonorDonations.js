import React from 'react';
import { filter } from 'lodash';
import DonationDetails from './DonationDetails';

const CandidateDonorDonations = props => {
  const { donations, candidate } = props;

  // const flattened = flattenDeep(donations);
  // console.log('flattened', flattened);
  console.log('donations', donations);
  const filtered = filter(donations, function(item) {
    console.log('item', item);
    if (item.candidate) return item.candidate.uuid === candidate;
  });
  console.log(filtered);

  return (
    <>
      {filtered.map(donation => (
        <DonationDetails key={donation.id} donation={donation} />
      ))}
    </>
  );
};

export default CandidateDonorDonations;
