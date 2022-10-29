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
const statsFilePath = `./results/${date}/data/_stats.json`;
if (!fs.existsSync(statsFilePath)) {
  console.error(`The data file ${statsFilePath} does not exist.`);
  return process.exit();
}
const statsData = require(statsFilePath);

const numberOfVocabsHavingAtLeastOneInstance = Object.keys(statsData).filter((s) => statsData[s] > 0).length;

console.log('number of vocabs having at least one instance', numberOfVocabsHavingAtLeastOneInstance);


const cubeFilePath = `./results/${date}/data/_all.csv`;
if (!fs.existsSync(cubeFilePath)) {
  console.error(`The data file ${cubeFilePath} does not exist.`);
  return process.exit();
}
const cubeData = fs.readFileSync(cubeFilePath, 'utf8');

const dimensions = ['isSkos', 'hasClass', 'hasNamespace'];
const values = [true, false];


const items = [];
values.forEach((v1) => {
  dimensions.slice(0, 1).forEach((d1) => {
    values.forEach((v2) => {
      dimensions.slice(1, 2).forEach((d2) => {
        values.forEach((v3) => {
          dimensions.slice(2, 3).forEach((d3) => {
            items.push({ [d1]: v1, [d2]: v2, [d3]: v3, count: 0 });
          });
        });
      });
    });
  });
});
// console.log(items);

const lines = cubeData.split(/[\r\n]+/).filter((l) => !!l.trim()).slice(1);
// const evaluationPairs = {
//   isSkos: 'skosConcept',
//   hasClass: 'classIRI',
//   hasNamespace: 'instance_is_in_ontology_namespace',
// };
const evaluateCondition = (item, lineValues) => {
  const { isSkos, hasClass, hasNamespace } = item;
  const { skosConcept, classIRI, instance_is_in_ontology_namespace } = lineValues;
  if (isSkos === true && hasClass === true && hasNamespace === true) {
    if (skosConcept !== '-' && classIRI !== '-' && instance_is_in_ontology_namespace === 'true') {
      return true;
    }
  }
  if (isSkos === true && hasClass === true && hasNamespace === false) {
    if (skosConcept !== '-' && classIRI !== '-' && instance_is_in_ontology_namespace !== 'true') {
      return true;
    }
  }
  if (isSkos === true && hasClass === false && hasNamespace === true) {
    if (skosConcept !== '-' && classIRI === '-' && instance_is_in_ontology_namespace === 'true') {
      return true;
    }
  }
  if (isSkos === true && hasClass === false && hasNamespace === false) {
    if (skosConcept !== '-' && classIRI === '-' && instance_is_in_ontology_namespace !== 'true') {
      return true;
    }
  }
  if (isSkos === false && hasClass === true && hasNamespace === true) {
    if (skosConcept === '-' && classIRI !== '-' && instance_is_in_ontology_namespace === 'true') {
      return true;
    }
  }
  if (isSkos === false && hasClass === true && hasNamespace === false) {
    if (skosConcept === '-' && classIRI !== '-' && instance_is_in_ontology_namespace !== 'true') {
      return true;
    }
  }
  if (isSkos === false && hasClass === false && hasNamespace === true) {
    if (skosConcept === '-' && classIRI === '-' && instance_is_in_ontology_namespace === 'true') {
      return true;
    }
  }
  if (isSkos === false && hasClass === false && hasNamespace === false) {
    if (skosConcept === '-' && classIRI === '-' && instance_is_in_ontology_namespace !== 'true') {
      return true;
    }
  }
  return false;
  // const dimensions = Object.keys(evaluationPairs);
  // const conditions = [];
  // for (d of dimensions) {
  //   const valueKey = evaluationPairs[d];
  //   if (['skosConcept', 'classIRI'].includes(valueKey)) {
  //     conditions.push(item[d] ? lineValues[valueKey] === '-' : lineValues[valueKey] !== '-');
  //   } else {
  //     conditions.push(item[d] ? lineValues[valueKey] === 'true' : lineValues[valueKey] !== 'true');
  //   }
  // }
  // return !!conditions.filter((c) => c).length;
};
items.forEach((item) => {
  lines.forEach((line) => {
    const [
      instance,
      classIRI,
      skosConcept,
      skosConceptScheme,
      ontology,
      ontology_vann_namespace,
      instance_namespace,
      instance_is_in_ontology_namespace,
      class_is_scheme,
      class_is_in_ontology_namespace
    ] = line.split('\t');
    const lineValues = { classIRI, skosConcept, instance_is_in_ontology_namespace };
    const conditionMet = evaluateCondition(item, lineValues);
    if (conditionMet) {
      //console.log(conditionMet, line);
      item.count++;
    }
  });
});

console.log('cube results', items);
