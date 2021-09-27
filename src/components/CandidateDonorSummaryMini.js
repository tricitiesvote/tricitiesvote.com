import React from 'react';
import { orderBy } from 'lodash';
import Emoji from 'a11y-react-emoji';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const CandidateDonorSummaryMini = props => {
  const { fundraising } = props;
  const donorsSorted = orderBy(fundraising.donors, 'total_donated', 'desc');
  const topDonors = donorsSorted.slice(0, 8);
  if (!fundraising) {
    return '';
  }
  return (
    <div className="donor-summary">
      <h3>Donors</h3>
      <p>
        <Emoji symbol="💰" label="moneybag" />
        <strong>
          {usd.format(fundraising.total_raised)} from{' '}
          {fundraising.unique_donors}
          <span
            className="why-plus"
            title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch."
          >
            +
          </span>{' '}
          donors
        </strong>
        <span className="including">, including </span>
        {topDonors.map(person => (
          <span className="topdonors">
            {person.name}{' '}
            <span className="topdonors-amount">(${person.total_donated})</span>
          </span>
        ))}
        .
      </p>
    </div>
  );
};

export default CandidateDonorSummaryMini;
