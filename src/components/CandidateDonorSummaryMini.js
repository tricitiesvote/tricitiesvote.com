import React from 'react';
import { orderBy } from 'lodash';
import DonationDetailsMini from './DonationDetails';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const CandidateDonorSummaryMini = props => {
  const { fundraising } = props;
  // console.log(props);
  const donorsSorted = orderBy(fundraising.donors, 'total_donated', 'desc');
  // console.log(donorsSorted);
  return (
    <div className="donor-summary">
      <p>
        Reported raised {usd.format(fundraising.total_raised)} from{' '}
        {fundraising.unique_donors}
        <span
          className="why-plus"
          title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch."
        >
          +
        </span>{' '}
        unique donors.{' '}
        <span className="cash-vs-in-kind">
          ({usd.format(fundraising.total_cash)} in cash,{' '}
          {usd.format(fundraising.total_in_kind)} in kind)
        </span>
      </p>
    </div>
  );
};

export default CandidateDonorSummaryMini;
