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

  // function handleChange(e) {
  //  props.onChange(e);
  // }
  if (document) {
    const table = document.querySelector('table');
  } else {
    const table = null;
  }
  const hornSound = new Audio('https://app.tumbleweird.org/sounds/horn.mp3');
  hornSound.volume = 0.01;

  const handleChange = e => {
    const { target } = e;
    // console.log(target.classList);
    const value = target.type === 'checkbox' ? target.checked : target.value;
    console.log('value is', value);
    console.log('checked is', target.checked);
    setState({
      ...state,
      [target.name]: value,
    });

    if (document && table && target.checked) {
      console.log(table.classList);
      console.log(target.name);
      table.classList.add(target.name);
    }
    if (document && table && !target.checked) {
      console.log(target.name);
      console.log(table.classList);
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
          <div
            className={
              state.ld8rep1 === true
                ? 'color-key wa8-rep1 show'
                : 'color-key wa8-rep1 hide'
            }
          >
            <span>8th LD Rep 1</span>
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
            <span>8th LD Rep 2</span>
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
            <span>9th LD Rep 1</span>
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
            <span>16th LD Rep 1</span>
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
            <span>16th LD Rep 2</span>
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
            <span>16th LD Senator</span>
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
