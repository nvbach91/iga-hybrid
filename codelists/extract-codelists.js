const axios = require('axios');
const argv = require('yargs').argv;
const date = argv.date;
const moment = require('moment');

if (!date) {
    console.error(`You must specify a folder name that contains the result file like so: --date=${moment().format('YYYY-MM-DD')}`);
    return process.exit();
}
const fs = require('fs');
if (!fs.existsSync(`../aggregate/results/${date}`)) {
    console.error('The specified folder does not exist in the ../aggregate/results folder');
    return process.exit();
}
const filePath = `../aggregate/results/${date}/${date}_lov-analyzer-results.json`;
if (!fs.existsSync(filePath)) {
    console.error(`The data file ${filePath} does not exist.`);
    return process.exit();
}

const codeLists = require(`../aggregate/results/${date}/${date}_lov-analyzer-results-flat.json`);
const codeListIris = Object.keys(codeLists);
const { username, password, endpoint } = require('./config.json');
const downloadFolder = `./results/${date}`;
let dir = '.';
downloadFolder.split('/').slice(1).forEach((step) => {
  dir = `${dir}/${step}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});
const prefixes = require('../common/prefixes.json');

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
        ?codeList a skos:ConceptScheme .
        ?code1 a skos:Concept .
        ?code1 skos:inScheme ?codeList .
        ?code1 rdfs:comment ?code1Comment .
        ?code1 rdfs:label ?code1Label .
        ?code1 ?p ?code2 .
    }
    FROM <${vocabIri}>
    WHERE {
        BIND(<${codeListIri}> AS ?codeList)
        ?code1 a ?codeList .
        OPTIONAL { ?code1 rdfs:comment ?code1Comment . }
        OPTIONAL { ?code1 rdfs:label|dc:title|dcterms:title ?code1Label . }
        OPTIONAL {
            ?code2 a ?codeList .
            ?code1 ?p ?code2 .
        }
    } */
const labelProps = 'rdfs:label|dc:title|dcterms:title|skos:prefLabel';
const commentProps = 'rdfs:comment|dc:description|dcterms:description';
const filterLangs = (v) => `FILTER(LANGMATCHES(LANG(${v}), "en") || LANGMATCHES(LANG(${v}), ""))`;

const createCodeListQuery = (codeListIri, vocabIri) => `
    ${Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n')}
    # ?p = relationship between ?code1 and ?code2
    # ?ap = assignment property
    # ?dt = assignment property domain term
    CONSTRUCT {
        ?codeList       a                   skos:ConceptScheme .
        ?code1          a                   skos:Concept .
        ?code1          skos:inScheme       ?codeList .
        ?codeList       rdfs:comment        ?codeListComment .
        ?codeList       rdfs:label          ?codeListLabel .
        ?code1          rdfs:comment        ?code1Comment .
        ?code1          rdfs:label          ?code1Label .
        ?code1          ?p                  ?code2 .
        ?code2          a                   skos:Concept .
        ?ap             rdfs:range          ?codeList . 
        ?ap             rdfs:domain         ?dt .
        ?ap             rdfs:label          ?apLabel .
        ?ap             rdfs:comment        ?apComment .
        ?ap             a                   ?apType .
        <${vocabIri}>   a                   owl:Ontology .
        ?codeList       rdfs:isDefinedBy    <${vocabIri}> .
        ?code1          rdfs:isDefinedBy    <${vocabIri}> .
        ?code2          rdfs:isDefinedBy    <${vocabIri}> .
        #?ap             rdfs:isDefinedBy    <${vocabIri}> .
        #?dt             rdfs:isDefinedBy    <${vocabIri}> .
    }
    FROM <${vocabIri}>
    WHERE {
        BIND(<${codeListIri}> AS ?codeList)
        ?code1 a ?codeList .
        FILTER NOT EXISTS { ?code1 a owl:Ontology }
        OPTIONAL { ?codeList ${labelProps} ?codeListLabel . ${filterLangs('?codeListLabel')} }
        OPTIONAL { ?codeList ${commentProps} ?codeListComment . ${filterLangs('?codeListComment')} }
        OPTIONAL { ?code1 ${labelProps} ?code1Label . ${filterLangs('?code1Label')} }
        OPTIONAL { ?code1 ${commentProps} ?code1Comment . ${filterLangs('?code1Comment')} }
        OPTIONAL {
            ?code2 a ?codeList .
            ?code1 ?p ?code2 .
        }
        OPTIONAL {
            ?ap rdfs:range ?codeList . 
            OPTIONAL { ?ap a ?apType . }
            OPTIONAL { ?ap ${labelProps} ?apLabel . ${filterLangs('?apLabel')} }
            OPTIONAL { ?ap ${commentProps} ?apComment . ${filterLangs('?apComment')} }
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
