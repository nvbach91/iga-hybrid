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
  }
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
const resultsFilePath = './results.csv';

const start = async () => {
  fs.writeFileSync(resultsFilePath, ['instance', 'class', 'skos', 'ontology', 'ontology vann:namespace'].join('\t'));
  // const results = [];
  for (let i = 0; i < ontologies.length; i++) {
    const { o, ns } = ontologies[i];
    try {
      console.log('querying instances in ontology', o);
      const resp1 = await axios.post(url, `query=${PREFIXES}${QUERY_INSTANCES_IN_ONTOLOGY(o)}`, axiosConfig);
      const instances = resp1.data.results.bindings.map((b) => b.i.value);
      for (let j = 0; j < instances.length; j++) {
        const instance = instances[j];
        try {
          console.log('|   querying classes of instance', instance, o);
          const resp2 = await axios.post(url, `query=${PREFIXES}${QUERY_CLASSES_OF_INSTANCE(o, instance)}`, axiosConfig);
          let isSkosConcept = false;
          resp2.data.results.bindings.map((b) => b.c.value).forEach((c) => {
            if (c === skosConceptIri) {
              isSkosConcept = true;
            } else {
              const result = [instance, c, isSkosConcept ? 1 : 0, o, ns];
              // results.push(result);
              fs.appendFileSync(resultsFilePath, `\n${result.join('\t')}`);
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
};

start();
