// rough helper to grab

import assert from "node:assert";
import { promises as fs } from "node:fs";
import _ from "lodash";
import slugify from "slugify";

// TODO: this is only *implicity* available via gatsby-transformer-csv
// (if this script stays around, a direct dependency should be added!)
import csv from "csvtojson";

// HT: https://stackoverflow.com/questions/66726365/how-should-i-import-json-in-node/66726426#66726426
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const NAMES = _require("./load-config-names.json");


function findCandidateViaName(name) {
  return (
    _.find(NAMES, { formattedName: name }) ||
    _.find(NAMES, { altNames: [ name ]})
  );
}


function cleanupRow(row) {  // NOTE: modifies in place!!
  const fa = row.forAgainst.trim().toLowerCase();
  assert(
    fa === 'for' || fa === 'against',
    `Must have valid forAgainst field (has: '${row.forAgainst}').`
  );
  
  const _baseT = row.type.trim().toLowerCase();
  const _splitT = _baseT.split(' - ');
  if (_splitT.length > 1) {
    assert((
      (_splitT[1] === 'pro recall' && fa === 'against') ||
      (_splitT[1] === 'antirecall' && fa === 'for')
    ), `Letter category should match position (${_splitT[0]} vs. ${fa}).`);
  }
  
  const t = _splitT[0];
  assert(
    t === 'endorsement' || t === 'letter',
    `Must have valid type (has: '${row.type}').`
  );
  
  const info = findCandidateViaName(row.name);
  // NOTE: if missing can search at https://www.pdc.wa.gov/political-disclosure-reporting-data
  //       and (as of 2023-October) follow through the "Registration" date link which will include
  //       in the "Registration Filed" section a line containing the `pdcId` we use for this stuff.
  assert(info, `Must have candidate NAMES info ("${row.name}" not found).`);
  if (row.candidate) assert(
    row.candidate === info.pdcId,
    `Expected pdcId of ${info.pdcId} (got: '${row.candidate}').`
  );
  const candidate = info.pdcId;
  assert(candidate, "NAMES info must have pdcId available.");
  
  const endorser = row.endorser.trim();
  assert(endorser, "Endorser column must not be empty.");
  
  const url = row.url.trim();
  assert(url, "URL column must not be empty.");
  assert(
    (url.match(/http/g) || []).length === 1,
    `URL shouldn't be sus (check <${row.url}>).`
  );
  
  return {candidate, endorser, url, type:t, forAgainst:fa};
}


async function convertTheThings(inputPath, outputFolder) {
  const csvContent = await fs.readFile(inputPath, 'utf8');
  const rows = await csv().fromString(csvContent);

  let numFiles = 0,
      numSkips = 0;
  for (const [idx, row] of rows.entries()) {
    let _jsonData;   // WORKAROUND: JS scope limitations…
    try {
      _jsonData = cleanupRow(row);
    } catch (err) {
      const rowNum = idx + 1; // n.b. assumes CSV has one header row!
      console.warn('‼️', `Skipping row #${rowNum}:`, err.message);
      numSkips += 1;
      continue;
    }
    assert(_jsonData);
    
    const jsonData = _jsonData;
    const { endorser, forAgainst, candidate } = jsonData;
    const filename = slugify(
      `${endorser} ${forAgainst} ${candidate}`,
      { lower: true, strict: true }
    );
    console.log('💾', `Writing ${filename}.`);
    fs.writeFile(
      `${outputFolder}/${filename}.json`,
      JSON.stringify(jsonData, null, 2)
    );
    
    numFiles += 1;
  }
  return {numFiles, numSkips};
}


const inputPath = process.argv[2];
const outputDir = "data/endorsements";
assert(inputPath, "Must provide path to input CSV as arg!");
convertTheThings(inputPath, outputDir).then(({numFiles,numSkips}) => {
  console.log(`Done! Wrote ${numFiles} files to ${outputDir}.`);
  if (numSkips) console.warn('⚠️', `Skipped ${numSkips} rows…`);
}).catch((err) => {
  console.error("Load failed:", err);
  process.exit(1);
});
