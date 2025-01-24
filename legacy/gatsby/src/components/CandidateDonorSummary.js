/* eslint-disable react/jsx-indent */
import React from 'react';
import { orderBy } from 'lodash';
import DonationDetails from './DonationDetails';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});

const handleClick = e => {
  e.target.parentElement.parentElement.classList.toggle('show-details');
};

const CandidateDonorSummary = ({ fundraising, minifiler }) => {
  // console.log('candidateDonorSummary props', props);

  if (
    (!fundraising && !minifiler) ||
    (fundraising.donors.length === 0 && !minifiler)
  ) {
    return <p>No fundraising data reported</p>;
  }
  if (minifiler) {
    return <p>Self-funded / mini-filer</p>;
  }
  const donorsSorted = orderBy(fundraising.donors, 'total_donated', 'desc');
  // console.log(donorsSorted);
  return (
    <div className="donor-summary">
      <h3>Donors</h3>
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
      <p className="helptext">
        Click the triangle to see more details and links to financial disclosure
        reports.
      </p>
      <div className="donors-list">
        {donorsSorted && donorsSorted.length > 0
          ? donorsSorted.map(donor => (
              <ul key={donor.id} className="donor">
                <p>
                  <button
                    aria-label="show/hide details"
                    type="button"
                    title="Show/hide details"
                    className="toggle-details"
                    onClick={e => handleClick(e)}
                  />
                  {donor.name} ({usd.format(donor.total_donated)})
                </p>
                {donor.donations && donor.donations.length > 0
                  ? donor.donations.map(donation => (
                      <DonationDetails key={donation.id} donation={donation} />
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
