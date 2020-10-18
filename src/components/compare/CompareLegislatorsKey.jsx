import React, { useState } from 'react';
import {
  BradKlippert,
  BrettBorden,
  CarlyCoburn,
  DanielleGarbeReser,
  FrancesChvatal,
  LarryStanley,
  MarkKlicker,
  MaryDye,
  MattBoehnke,
  PerryDozier,
  ShirRegev,
  SkylerRude,
} from '../candidates';

const CompareLegislatorsKey = () => {
  const [state, setState] = useState({
    ld8rep1: true,
    ld8rep2: true,
    ld9rep1: true,
    ld16rep1: true,
    ld16rep2: true,
    ld16senator: true,
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
    <>
      <div className="color-key-set">
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld8rep1"
            onChange={handleChange}
            checked={state.ld8rep1}
          />
          <div className="color-key wa8-rep1">
            <span>LD 8 Rep 1</span>
            <BradKlippert mini />
            <ShirRegev mini />
            <span>Klippert vs. Regev</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld8rep2"
            onChange={handleChange}
            checked={state.ld8rep2}
          />
          <div className="color-key wa8-rep2">
            <span>LD 8 Rep 2</span>
            <MattBoehnke mini spec dnr />
            <LarryStanley mini />
            <span>Boehnke vs. Stanley</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld9rep1"
            onChange={handleChange}
            checked={state.ld9rep1}
          />
          <div className="color-key wa9-rep1">
            <span>LD 9 Rep 1</span>
            <BrettBorden mini />
            <MaryDye mini spec dnr />
            <span>Borden vs. Dye</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld16rep1"
            onChange={handleChange}
            checked={state.ld16rep1}
          />
          <div className="color-key wa16-rep1">
            <span>LD 16 Rep 1</span>
            <FrancesChvatal mini />
            <MarkKlicker mini />
            <span>Borden vs. Dye</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld16rep2"
            onChange={handleChange}
            checked={state.ld16rep2}
          />
          <div className="color-key wa16-rep2">
            <span>LD 16 Rep 2</span>
            <SkylerRude mini spec dnr />
            <CarlyCoburn mini />
            <span>Rude vs. Coburn</span>
          </div>
        </label>
        <label className="color-key-container">
          <input
            type="checkbox"
            name="ld16senator"
            onChange={handleChange}
            checked={state.ld16senator}
          />
          <div className="color-key wa16-senator">
            <span>LD 16 Senator</span>
            <DanielleGarbeReser mini />
            <PerryDozier mini spec dnr />
            <span>Reser vs. Dozier</span>
          </div>
        </label>
      </div>
      {/* <p>
        Opponents have matching colors. Click their faces—they might have more to say.
      </p> */}
      <p>
        Perry Dozier, Skyler Rude, Mary Dye, and Matt Boehnke did not complete
        our Q&A despite numerous attempts on our part. These candidates’
        positions were speculated to the best of our ability based on comments,
        traditional party positions, publicly available information, and
        consultations with engaged citizens.
      </p>
      {/* <div className="">
          <PerryDozier mini spec dnr />
          <SkylerRude mini spec dnr />
          <MaryDye mini spec dnr />
          <MattBoehnke mini spec dnr />
        </div> */}
    </>
  );
};

export default CompareLegislatorsKey;
