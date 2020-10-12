import React from 'react';
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
  return (
    <>
      <p>Opponents have matching colors:</p>
      <div>
        <div className="color-key wa8-rep1">
          <span>8th LD Rep 1</span>
          <BradKlippert mini />
          <ShirRegev mini />
          <span>Klippert vs. Regev</span>
        </div>
        <div className="color-key wa8-rep2">
          <span>8th LD Rep 2</span>
          <MattBoehnke mini spec dnr />
          <LarryStanley mini />
          <span>Boehnke vs. Stanley</span>
        </div>
        <div className="color-key wa9-rep1">
          <span>9th LD Rep 1</span>
          <BrettBorden mini />
          <MaryDye mini spec dnr />
          <span>Borden vs. Dye</span>
        </div>
        <div className="color-key wa16-rep1">
          <span>16th LD Rep 1</span>
          <FrancesChvatal mini />
          <MarkKlicker mini />
          <span>Borden vs. Dye</span>
        </div>
        <div className="color-key wa16-rep2">
          <span>16th LD Rep 2</span>
          <SkylerRude mini spec dnr />
          <CarlyCoburn mini />
          <span>Rude vs. Coburn</span>
        </div>
        <div className="color-key wa16-senator">
          <span>16th LD Sen</span>
          <DanielleGarbeReser mini />
          <PerryDozier mini spec dnr />
          <span>Reser vs. Dozier</span>
        </div>
      </div>
      <p>Click their faces—they might have more to say.</p>
    </>
  );
};

export default CompareLegislatorsKey;
