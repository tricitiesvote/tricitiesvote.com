import React from 'react';

const CompareKey = props => {
  return (
    <p>
      Opponents have matching colors:
      <span className="color-key pos-5">pos 5</span>
      <span className="color-key pos-6">pos 6</span>
      <span className="color-key pos-7">pos 7</span>
      Click their faces—they might have more to say.
    </p>
  );
};

export default CompareKey;
