import React from 'react';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const CandidateDonorSummaryMini = props => {
  const { fundraising } = props;
  // console.log(props);
  if (!fundraising) {
    return '';
  }
  return (
    <div className="donor-summary">
      <p>
        Reported raised <strong>{usd.format(fundraising.total_raised)}</strong> from{' '}
        <strong>{fundraising.unique_donors}</strong>
        <span
          className="why-plus"
          title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch."
        >
          +
        </span>{' '}
        unique donors.
      </p>
    </div>
  );
};

export default CandidateDonorSummaryMini;
