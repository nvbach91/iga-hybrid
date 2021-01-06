const fs = require('fs');
const axios = require('axios');
const { username, password, host, path, namespace } = require('./config.json');
const { PREFIXES, QUERY_INSTANCES_IN_ONTOLOGY, QUERY_CLASSES_OF_INSTANCE } = require('./sparql');
const Bluebird = require('bluebird');

const axiosConfig = {
  headers: {
    'accept': 'application/sparql-results+json,*/*;q=0.9',
    // 'accept': 'application/rdf+xml,*/*;q=0.9',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  },
  timeout: 2000,
};
const url = `${host}${path}/namespace/${namespace}/sparql`;

const ontologies = require('./responses/ontologies.json').results.bindings.map((b) => ({
  o: b.o.value,
  ns: b.ns.value,
}));

const skosConceptIri = 'http://www.w3.org/2004/02/skos/core#Concept';
/*
{
}
*/
const resultsDirectory = './results';
const headers = ['instance', 'class', 'skos', 'ontology', 'ontology vann:namespace', 'instance namespace'];

const start = async () => {
  const results = {};
  for (let i = 0; i < 5; i++) {
    const { o, ns } = ontologies[i];
    const resultsFilePath = `${resultsDirectory}/${o.replace(/:/g, ';').replace(/\//g, '-').replace(/#/g, '_')}.csv`;
    fs.writeFileSync(resultsFilePath, `${headers.join('\t')}\n`);
    results[o] = 0;
    try {
      console.log('querying instances in ontology', o);
      const resp1 = await axios.post(url, `query=${encodeURIComponent(PREFIXES)}${encodeURIComponent(QUERY_INSTANCES_IN_ONTOLOGY(o))}`, axiosConfig);
      const instances = resp1.data.results.bindings.map((b) => b.i.value);
      for (let j = 0; j < instances.length; j++) {
        const instance = instances[j];
        try {
          console.log('|   querying classes of instance', instance, o);
          const resp2 = await axios.post(url, `query=${encodeURIComponent(PREFIXES)}${encodeURIComponent(QUERY_CLASSES_OF_INSTANCE(o, instance))}`, axiosConfig);
          let isSkosConcept = false;
          resp2.data.results.bindings.map((b) => b.c.value).forEach((c) => {
            if (c === skosConceptIri) {
              isSkosConcept = true;
            } else {
              const instanceNamespace = instance.slice(0, (instance.includes('#') ? instance.lastIndexOf('#') : instance.lastIndexOf('/')) + 1);
              const result = [instance, c, isSkosConcept ? 1 : 0, o, ns, instanceNamespace];
              results[o]++;
              fs.appendFileSync(resultsFilePath, `${result.join('\t')}\n`);
            }
          });
        } catch (e) {
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
