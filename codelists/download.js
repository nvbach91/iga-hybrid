const axios = require('axios');
const bluebird = require('bluebird');
const fs = require('fs');

const codeLists = require('../results/2019-07-20_lov-analyzer-results-flat.json');
const codeListIris = Object.keys(codeLists);
const { username, password, endpoint } = require('../config.json');
const downloadFolder = './results';

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
    }
};
const createCodeListQuery = (codeListIri, vocabIri) => `
${Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n')}

CONSTRUCT {
    ?cl a skos:ConceptScheme .
    ?c1 a skos:Concept .
    ?c1 skos:inScheme ?cl .
    ?c1 rdfs:comment ?c1comment .
    ?c1 rdfs:label ?c1label .
    ?c1 ?p ?c2 .
}
FROM <${vocabIri}>
WHERE {
    BIND(<${codeListIri}> AS ?cl)
    ?c1 a ?cl .
    OPTIONAL { ?c1 rdfs:comment ?c1comment . }
    OPTIONAL { ?c1 rdfs:label|dc:title|dct:title ?c1label . }
    OPTIONAL {
        ?c2 a ?cl .
        ?c1 ?p ?c2 .
    }
}
`;

const download = async (iris) => {
    const failedIris = [];
    for (let i = 0; i < iris.length; i++) {
        const codeListIri = iris[i];
        const query = createCodeListQuery(codeListIri, codeLists[codeListIri].vocab);
        // console.log(query);
        try {
            const resp = await axios.post(endpoint, `query=${query}`, axiosConfig);
            console.log(`DONE: ${codeListIri}`);
            const fileName = `${downloadFolder}/${codeListIri.replace(/\//g, '-').replace(/#/g, '_').replace(/:/g, ';')}.rdf`;
            // console.log(fileName);
            fs.writeFileSync(fileName, resp.data);
        } catch (e) {
            failedIris.push(codeListIri);
        }
    }
    if (failedIris.length) {
        download(failedIris);
    }
};

download(codeListIris);