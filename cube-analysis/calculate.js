const argv = require('yargs').argv;
const moment = require('moment');
const date = argv.date;

if (!date) {
  console.error(`You must specify a folder name that contains the result file like so: --date=${moment().format('YYYY-MM-DD')}`);
  return process.exit();
}
const fs = require('fs');
if (!fs.existsSync(`./results/${date}`)) {
  console.error('The specified folder does not exist in the ./results folder.');
  return process.exit();
}
const filePath = `./results/${date}/data/_stats.json`;
if (!fs.existsSync(filePath)) {
  console.error(`The data file ${filePath} does not exist.`);
  return process.exit();
}
const statsData = require(filePath);

const numberOfVocabsHavingAtLeastOneInstance = Object.keys(statsData).filter((s) => statsData[s] > 0).length;

console.log('numberOfVocabsHavingAtLeastOneInstance', numberOfVocabsHavingAtLeastOneInstance);
