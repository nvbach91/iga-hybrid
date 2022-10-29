const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const bluebird = require('bluebird');
const records = {};
const { endpoint, username, password } = require('./config.json')
const axiosConfig = {
  headers: {
    'accept': 'application/sparql-results+json,*/*;q=0.9',
    // 'accept': 'application/rdf+xml,*/*;q=0.9',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  }
};

const getQueryClassInstanceCounts = (vocabIri) => `
  SELECT DISTINCT ?d ?p ?c (COUNT(DISTINCT ?i) AS ?ni) (BOUND(?sc) AS ?s)
  FROM <${vocabIri}> 
  WHERE {
    VALUES ?class { owl:Class rdf:Class }
    ?c a ?class .
    #?i a|rdfs:subClassOf ?c .
    ?i a ?c .
    OPTIONAL {
      BIND(skos:Concept AS ?sc) 
      ?i a skos:Concept .
    }
    OPTIONAL { 
      ?p rdfs:range ?c . 
      OPTIONAL { ?p rdfs:domain ?d }
    }
  } GROUP BY ?d ?p ?c ?sc ORDER BY DESC(?ni)
`;

const prefixes = require('../common/prefixes.json');

const PREFIXES = Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n') + '\n';

const vocabIris = require('./vocabs.json');

const fetchResult = (vocabIri, index, total) => {
  console.log('Fetching result data for:', `${index}/${total}`, vocabIri);
  const query = getQueryClassInstanceCounts(vocabIri)
  const payload = `query=${PREFIXES}${query}`;
  return axios.post(endpoint, payload, axiosConfig).then((resp) => {
    const codeLists = {};
    resp.data.results.bindings.filter((binding) => binding.ni.value > 0).forEach((binding) => {
      const { d, p, c, ni, s } = binding;
      const uuid = uuidv4();
      const codeList = { d, p, c, ni, s };
      codeList.i = 0;
      codeLists[uuid] = codeList;
    });
    const uniqueCodeLists = {};
    
    const skos = !!Object.keys(codeLists).filter((key) => codeLists[key].s.value === 'true').length;
    Object.keys(codeLists).forEach((key) => {
      if (uniqueCodeLists[codeLists[key].c.value] && codeLists[key].p) {
        uniqueCodeLists[codeLists[key].c.value].properties++;
      } else {
        uniqueCodeLists[codeLists[key].c.value] = {
          instances: parseFloat(codeLists[key].ni.value) || 0,
          properties: codeLists[key].p ? 1 : 0,
          skos,
        };
      }
    });
    records[vocabIri] = uniqueCodeLists;
  });
};

const operate = () => {
  bluebird.each(vocabIris, (vocabIri, index) => fetchResult(vocabIri, index, vocabIris.length)).then(() => {
    const resultFolder = `./results/${moment().format('YYYY-MM-DD')}/`;
    if (!fs.existsSync(resultFolder)) {
      fs.mkdirSync(resultFolder);
    }
    const path = `${resultFolder}/${moment().format('YYYY-MM-DD')}_lov-analyzer-results.json`;
    fs.writeFileSync(path, JSON.stringify(records, null, 2));
    const pathFlat = `${resultFolder}/${moment().format('YYYY-MM-DD')}_lov-analyzer-results-flat.json`;
    const flatData = {};
    Object.keys(records).forEach((vocabIri) => {
      Object.keys(records[vocabIri]).forEach((codeListIri) => {
        flatData[codeListIri] = {
          vocab: vocabIri,
          codes: {
            instances: records[vocabIri][codeListIri].instances,
            properties: records[vocabIri][codeListIri].properties,
          }
        };
      })
    });
    fs.writeFileSync(pathFlat, JSON.stringify(flatData, null, 2));
  }).catch((e) => {
    console.error(e);
  })
};

operate();

/*
const resultFolder = `./results/2022-10-23/`;
const path = `${resultFolder}/2022-10-23_lov-analyzer-results.json`;
const rs = require(path);
const pathFlat = `${resultFolder}/2022-10-23_lov-analyzer-results-flat.json`;
  const flatData = {};
  Object.keys(rs).forEach((vocabIri) => {
    Object.keys(rs[vocabIri]).forEach((codeListIri) => {
      flatData[codeListIri] = {
        vocab: vocabIri,
        codes: {
          instances: rs[vocabIri][codeListIri].instances,
          properties: rs[vocabIri][codeListIri].properties,
        }
      };
    })
  });
  fs.writeFileSync(pathFlat, JSON.stringify(flatData, null, 2));
*/