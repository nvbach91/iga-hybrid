const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const { username, password, endpoint } = require('./config.json');
const { QUERY_INSTANCES_IN_ONTOLOGY, QUERY_CLASSES_OF_INSTANCE, QUERY_ONTOLOGIES_AND_NAMESPACES } = require('./sparql');

const axiosConfig = {
  headers: {
    'accept': 'application/sparql-results+json,*/*;q=0.9',
    // 'accept': 'application/rdf+xml,*/*;q=0.9',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  },
  timeout: 20000,
};


// const ontologies = require('./responses/ontologies.json').results.bindings.map((b) => ({
//   o: b.o.value,
//   ns: b.ns.value,
// }));

const skosConceptIri = 'http://www.w3.org/2004/02/skos/core#Concept';

const resultsDirectory = `./results/${moment().format('YYYY-MM-DD')}/data`;

let dir = '.';
resultsDirectory.split('/').slice(1).forEach((step) => {
  dir = `${dir}/${step}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

const headers = [
  'instance', 'class', 'skosConcept', 'skosConceptScheme', 
  'ontology', 'ontology vann:namespace', 'instance namespace',
  'instance is in ontology namespace', 'class is scheme', 'class is in ontology namespace'
];

const start = async () => {
  const ontologiesResp = await axios.post(endpoint, `query=${encodeURIComponent(QUERY_ONTOLOGIES_AND_NAMESPACES())}`, axiosConfig);
  const ontologies = ontologiesResp.data.results.bindings.map((b) => ({
    o: b.o.value,
    ns: b.ns ? b.ns.value : '',
  }));
  const results = {};
  for (let i = 0; i < ontologies.length; i++) {
    const { o, ns } = ontologies[i];
    const resultsFilePath = `${resultsDirectory}/${o.replace(/:/g, '[c]').replace(/\//g, '[s]').replace(/#/g, '[h]')}.csv`;
    fs.writeFileSync(resultsFilePath, `${headers.join('\t')}\n`);
    results[o] = 0;
    try {
      console.log(`querying instances in ontology ${i + 1}/${ontologies.length}`, o);
      const resp1 = await axios.post(endpoint, `query=${encodeURIComponent(QUERY_INSTANCES_IN_ONTOLOGY(o))}`, axiosConfig);
      const instances = resp1.data.results.bindings.map((b) => b.i.value);
      for (let j = 0; j < instances.length; j++) {
        const instance = instances[j];
        try {
          console.log(`|   querying classes of instance ${j + 1}/${instances.length}`, instance, o);
          const resp2 = await axios.post(endpoint, `query=${encodeURIComponent(QUERY_CLASSES_OF_INSTANCE(o, instance))}`, axiosConfig);
          let skosConcept = '-';
          let skosScheme = '-';
          const classes = [];
          resp2.data.results.bindings.forEach((b) => {
            if (b.c) {
              if (b.c.value === skosConceptIri) {
                skosConcept = b.c.value;
              } else {
                classes.push(b.c.value);
              }
            }
            if (b.s && b.s.value) {
              skosScheme = b.s.value;
            }
          });
          const instanceNamespace = instance.slice(0, (instance.includes('#') ? instance.lastIndexOf('#') : instance.lastIndexOf('/')) + 1);
          classes.forEach((c) => {
            const result = [instance, c, skosConcept, skosScheme, o, ns, instanceNamespace, ns === instanceNamespace, c === skosScheme, c.startsWith(ns)];
            results[o]++;
            fs.appendFileSync(resultsFilePath, `${result.join('\t')}\n`);
          });
          if (!classes.length) {
            const result = [instance, '-', skosConcept, skosScheme, o, ns, instanceNamespace, ns === instanceNamespace, false, false];
            results[o]++;
            fs.appendFileSync(resultsFilePath, `${result.join('\t')}\n`);
          }
        } catch (e) {
          // console.log(e);
          console.error('|   error querying classes of instance', instance, o, '... retrying');
          j--;
          // console.error(QUERY_CLASSES_OF_INSTANCE(o, i));
        }
      }
    } catch (e) {
      console.error('error querying instances in ontology', o, '... retrying');
      i--;
    }
  }
  fs.writeFileSync(`${resultsDirectory}/_stats.json`, JSON.stringify(results, null, 2));

  const allData = headers.join('\t') + '\n' +
    fs.readdirSync(`${resultsDirectory}`).filter((fileName) => fileName.endsWith('.csv')).map((fileName) => {
      return fs.readFileSync(`${resultsDirectory}/${fileName}`, { encoding: 'utf8', flag: 'r' }).replace(`${headers.join('\t')}\n`, '').trim();
    }).filter((content) => !!content).join('\n') + '\n';

  fs.writeFileSync(`${resultsDirectory}/_all.csv`, allData);
};

start();
