import React from 'react';
import {
  AnaRuizPeralta,
  BradPeck,
  JeromeDelvin,
  JustinRaffa,
  KimLehrman,
  RockyMullen,
  JimBeaver,
  WillMcKay,
} from '../candidates';

const CompareLegislatorsKey = () => {
  return (
    <>
      <div className="color-key-set">
        <div className="color-key franklin-1">
          <span>Franklin Comm 1</span>
          <BradPeck mini spec />
          <KimLehrman mini />
          <span>Peck vs. Lehrman</span>
        </div>
        <div className="color-key franklin-2">
          <span>Franklin Comm 2</span>
          <AnaRuizPeralta mini />
          <RockyMullen mini dnr spec />
          <span>Peralta vs. Mullen</span>
        </div>
        <div className="color-key benton-1">
          <span>Benton Comm 1</span>
          <JeromeDelvin mini spec />
          <JustinRaffa mini />
          <span>Delvin vs. Raffa</span>
        </div>
      </div>
      {/* <p>
        Opponents have matching colors. Click their faces—they might have more to say.
      </p> */}
      <p>
        Rocky Mullen did not complete our Q&A despite numerous attempts on our
        part. Brad Peck and Jerome Delvin commented but did not choose A/B
        selections for most items. These candidates’ positions were speculated
        to the best of our ability based on comments, traditional party
        positions, publicly available information, and consultations with
        engaged citizens. Neither Will McKay nor Jim Beaver responded, so we
        skipped both.
      </p>
    </>
  );
};

export default CompareLegislatorsKey;
