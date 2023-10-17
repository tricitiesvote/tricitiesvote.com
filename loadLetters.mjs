// rough helper to grab

import assert from "node:assert";
import { promises as fs } from "node:fs";
import _ from "lodash";

// TODO: this is only *implicity* available via gatsby-transformer-csv
// (if this script stays around, a direct dependency should be added!)
import csv from "csvtojson";

// HT: https://stackoverflow.com/questions/66726365/how-should-i-import-json-in-node/66726426#66726426
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const NAMES = require("./load-config-names.json");


function findCandidateViaName(name) {
  return (
    _.find(NAMES, { formattedName: name }) ||
    _.find(NAMES, { altNames: [ name ]})
  );
}


function cleanupRow(row) {  // NOTE: modifies in place!!
  if (!row.candidate) {
    const info = findCandidateViaName(row.name);
    assert(info, `Must have candidate info for "${row.name}".`);
    row.candidate = info.pdcId;
  }

}


async function convertTheThings(inputPath, outputFolder) {
  const csvContent = await fs.readFile(inputPath, 'utf8');
  const rows = await csv().fromString(csvContent);

  let numFiles = 0;
  for (const row of rows) {
    console.log(row);

    try {
      cleanupRow(row);
    } catch (err) {
      console.warn(err);
      continue;
    }

    numFiles += 1;
  }

  throw "unfinished…";

  return {numFiles};
}


const inputPath = process.argv[2];
const outputDir = "data/endorsements";
assert(inputPath, "Must provide path to input CSV as arg!");
convertTheThings(inputPath, outputDir).then((info) => {
  console.log(`Done! Wrote ${info.numFiles} to ${outputDir}.`);
});
