import React from 'react';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const md = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const DonationDetails = props => {
  const { donation } = props;

  return (
    <li className="donation-event">
      {donation.report ? (
        <a href={donation.report} title={donation.detail}>
          <span role="image" aria-label="report">
            🧾
          </span>{' '}
          {usd.format(donation.amount)} on {md.format(donation.date)}
        </a>
      ) : (
        <>
          {usd.format(donation.amount)} on {md.format(donation.date)}
        </>
      )}
    </li>
  );
};

export default DonationDetails;
