import React from 'react';
import { orderBy } from 'lodash';
import DonationDetails from './DonationDetails';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const CandidateDonorSummary = props => {
  const { fundraising } = props;
  // console.log(props);
  
  if (!fundraising || fundraising.donors.length < 1) return '';
  const donorsSorted = orderBy(fundraising.donors, 'total_donated', 'desc');
  console.log(donorsSorted);
  return (
    <div className="donor-summary">
      <p>
        Reported raised {usd.format(fundraising.total_raised)} from{' '}
        {fundraising.unique_donors}<span className="why-plus" title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch.">+</span> unique donors.
        <span className="cash-vs-in-kind">
          ({usd.format(fundraising.total_cash)} in cash,{' '}
          {usd.format(fundraising.total_in_kind)} in kind)
        </span>
      </p>
      <div className="donors-list">
        {donorsSorted && donorsSorted.length > 0
          ? donorsSorted.map(donor => (
            <ul key={donor.id} className="donor">
                <p>
                {donor.name} ({usd.format(donor.total_donated)})
              </p>
                {donor.donations && donor.donations.length > 0
                  ? donor.donations.map(donation => (
                    <DonationDetails
                        key={donation.id}
                        donation={donation}
                      />
                    ))
                  : ''}
              </ul>
            ))
          : ''}
      </div>
    </div>
  );
};

export default CandidateDonorSummary;
