const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

const codeLists = require('../aggregate-data/2019-07-20_lov-analyzer-results-flat.json');
const codeListIris = Object.keys(codeLists);
const { username, password, endpoint } = require('./config.json');
const downloadFolder = `./results/results-${moment().format('YYYYMMDD')}`;
let dir = '.';
downloadFolder.split('/').slice(1).forEach((step) => {
  dir = `${dir}/${step}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});
const prefixes = {
    'vann': 'http://purl.org/vocab/vann/',
    'voaf': 'http://purl.org/vocommons/voaf#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'owl': 'http://www.w3.org/2002/07/owl#',
    'skos': 'http://www.w3.org/2004/02/skos/core#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dct': 'http://purl.org/dc/terms/',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dcmit': 'http://purl.org/dc/dcmitype/',
};

const axiosConfig = {
    headers: {
        // "accept": "application/sparql-results+json,*/*;q=0.9",
        "accept": "application/rdf+xml,*/*;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
};
/*  CONSTRUCT {
        ?cl a skos:ConceptScheme .
        ?c1 a skos:Concept .
        ?c1 skos:inScheme ?cl .
        ?c1 rdfs:comment ?c1Comment .
        ?c1 rdfs:label ?c1Label .
        ?c1 ?p ?c2 .
    }
    FROM <${vocabIri}>
    WHERE {
        BIND(<${codeListIri}> AS ?cl)
        ?c1 a ?cl .
        OPTIONAL { ?c1 rdfs:comment ?c1Comment . }
        OPTIONAL { ?c1 rdfs:label|dc:title|dct:title ?c1Label . }
        OPTIONAL {
            ?c2 a ?cl .
            ?c1 ?p ?c2 .
        }
    } */
const createCodeListQuery = (codeListIri, vocabIri) => `
    ${Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n')}
    # ?cl = code list
    # ?c1, ?c2 = class 1, class 2
    # ?p = relationship between ?c1 and ?c2
    # ?ap = assignment property
    # ?dt = assignment property domain
    # ?apLabel = assignment property label
    # ?apComment = assignment property comment
    CONSTRUCT {
        ?cl a skos:ConceptScheme .
        ?c1 a skos:Concept .
        ?c1 skos:inScheme ?cl .
        ?c1 rdfs:comment ?c1Comment .
        ?c1 rdfs:label ?c1Label .
        ?c1 ?p ?c2 .
        ?ap rdfs:range ?cl . 
        ?ap rdfs:domain ?dt.
        ?ap rdfs:label ?apLabel .
        ?ap rdfs:comment ?apComment .
        ?ap a ?apType .
        <${vocabIri}> a owl:Ontology .
        ?cl rdfs:isDefinedBy <${vocabIri}> .
        ?c1 rdfs:isDefinedBy <${vocabIri}> .
        ?c2 rdfs:isDefinedBy <${vocabIri}> .
        ?ap rdfs:isDefinedBy <${vocabIri}> .
        ?dt rdfs:isDefinedBy <${vocabIri}> .
    }
    FROM <${vocabIri}>
    WHERE {
        BIND(<${codeListIri}> AS ?cl)
        ?c1 a ?cl .
        FILTER NOT EXISTS { ?c1 a owl:Ontology }
        OPTIONAL { ?c1 rdfs:label|dc:title|dct:title ?c1Label . FILTER(LANGMATCHES(LANG(?c1Label), "en") || LANGMATCHES(LANG(?c1Label), "")) }
        OPTIONAL { ?c1 rdfs:comment|dc:description|dct:description ?c1Comment . FILTER(LANGMATCHES(LANG(?c1Comment), "en") || LANGMATCHES(LANG(?c1Comment), "")) }
        OPTIONAL {
            ?c2 a ?cl .
            ?c1 ?p ?c2 .
        }
        OPTIONAL {
            ?ap rdfs:range ?cl . 
            OPTIONAL { ?ap a ?apType . }
            OPTIONAL { ?ap rdfs:label|dc:title|dct:title ?apLabel . FILTER(LANGMATCHES(LANG(?apLabel), "en") || LANGMATCHES(LANG(?apLabel), "")) }
            OPTIONAL { ?ap rdfs:comment|dc:description|dct:description ?apComment . FILTER(LANGMATCHES(LANG(?apComment), "en") || LANGMATCHES(LANG(?apComment), "")) }
            OPTIONAL { ?ap rdfs:domain ?dt . }
        }
    }
`;

const download = async (iris) => {
    const failedIris = [];
    for (let i = 0; i < iris.length; i++) {
        const codeListIri = iris[i];
        const query = createCodeListQuery(codeListIri, codeLists[codeListIri].vocab);
        // console.log(query);
        console.log('Downloading', codeListIri);
        try {
            const resp = await axios.post(endpoint, `query=${query}`, axiosConfig);
            console.log(`DONE: ${codeListIri}`);
            const fileName = `${downloadFolder}/${codeListIri.replace(/\//g, '[s]').replace(/#/g, '[h]').replace(/:/g, '[c]')}.rdf`;
            // console.log(fileName);
            fs.writeFileSync(fileName, typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2));
        } catch (e) {
            console.error(e);
            failedIris.push(codeListIri);
        }
    }
    if (failedIris.length) {
        download(failedIris);
    }
};

download(codeListIris);
