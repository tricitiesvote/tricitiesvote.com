import React, { useState } from 'react';
import {
  AnaRuizPeralta,
  BradPeck,
  JeromeDelvin,
  JustinRaffa,
  KimLehrman,
  RockyMullen,
} from '../candidates';

const CompareLegislatorsKey = () => {
  const [state, setState] = useState({
    franklin1: true,
    franklin2: true,
    benton1: true,
  });

  const table =
    typeof document !== `undefined` ? document.querySelector(`table`) : null;

  const handleChange = e => {
    const { target } = e;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setState({
      ...state,
      [target.name]: value,
    });

    if (table && target.checked) {
      table.classList.add(target.name);
    }
    if (table && !target.checked) {
      table.classList.remove(target.name);
    }
  };

  return (
    <div className="compare-key">
      <h2 className="which-compare-o-tron">County Commissioners</h2>
      <div className="color-key-set">
        <label className="color-key-container">
          <input
            type="checkbox"
            name="franklin1"
            onChange={handleChange}
            checked={state.franklin1}
          />
          <div className="color-key franklin-1">
            <span>Franklin Comm 1</span>
            <BradPeck mini spec />
            <KimLehrman mini />
            <span>Peck vs. Lehrman</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="franklin2"
            onChange={handleChange}
            checked={state.franklin2}
          />
          <div className="color-key franklin-2">
            <span>Franklin Comm 2</span>
            <AnaRuizPeralta mini />
            <RockyMullen mini dnr spec />
            <span>Peralta vs. Mullen</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="benton1"
            onChange={handleChange}
            checked={state.benton1}
          />
          <div className="color-key benton-1">
            <span>Benton Comm 1</span>
            <JeromeDelvin mini spec />
            <JustinRaffa mini />
            <span>Delvin vs. Raffa</span>
          </div>
        </label>
      </div>
      <p>
        Opponents have matching colors. Click their faces—they might have more
        to say.
      </p>
      <p>
        Rocky Mullen did not complete our Q&A despite numerous attempts on our
        part. Brad Peck and Jerome Delvin commented but did not choose A/B
        selections for most items. These candidates’ positions were speculated
        to the best of our ability based on comments, traditional party
        positions, publicly available information, and consultations with
        engaged citizens. Neither Will McKay nor Jim Beaver responded, so we
        skipped both.
      </p>
    </div>
  );
};

export default CompareLegislatorsKey;
