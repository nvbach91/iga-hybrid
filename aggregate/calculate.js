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
const filePath = `./results/${date}/${date}_lov-analyzer-results.json`;
if (!fs.existsSync(filePath)) {
    console.error(`The data file ${filePath} does not exist.`);
    return process.exit();
}

let totalCodeListWithAtLeastOneAssignmentProperty = 0;
const data = require(filePath);
const vocabs = Object.keys(data).map((vocabIri) => {
    const vocab = data[vocabIri];
    let nCodes = 0;
    let nProperties = 0;
    const codeListIris = Object.keys(vocab);
    codeListIris.forEach((codeListIri) => {
        nCodes += vocab[codeListIri].instances;
        nProperties += vocab[codeListIri].properties;
        if (vocab[codeListIri].properties > 0) {
            totalCodeListWithAtLeastOneAssignmentProperty++;
        }
    });
    const skos = !!codeListIris.filter((iri) => vocab[iri].skos).length;
    return { iri: vocabIri, nCodeLists: codeListIris.length, nCodes, skos, nProperties };
});

// vocabs.sort((a, b) => {
//     return a.nCodeLists - b.nCodeLists;
//     // return a.nCodes - b.nCodes;
// });

const topVocabData = vocabs.map((vocab) => {
    return `${vocab.iri}\t${vocab.nCodeLists}\t${vocab.nCodes}\t${vocab.skos}\t${vocab.nProperties}`;
}).join('\r\n');

fs.writeFile(`./results/${date}/top-vocabs-data.csv`, topVocabData, () => {});
// console.log(topVocabData);

console.log('Total vocabs', '\t', vocabs.length);
console.log('Total vocabs with skos', '\t', vocabs.filter((v) => !!v.skos).length);
console.log('Total vocabs with candidate code lists', '\t', vocabs.filter((v) => v.nCodeLists > 0).length);
console.log('Total vocabs without candidate code lists', '\t', vocabs.filter((v) => v.nCodeLists < 1).length);
console.log('Total vocabs with codes', '\t', vocabs.filter((v) => v.nCodes > 0).length);
console.log('Total vocabs without codes', '\t', vocabs.filter((v) => v.nCodes < 1).length);
console.log('Total vocabs with assignment properties', '\t', vocabs.filter((v) => v.nProperties > 0).length);
console.log('Total vocabs without assignment properties', '\t', vocabs.filter((v) => v.nProperties < 1).length);
let totalCodeLists = 0;
let totalCodeListMembers = 0;
vocabs.forEach((v) => {
    totalCodeLists += v.nCodeLists;
    totalCodeListMembers += v.nCodes;
});
console.log('Total candidate code lists', '\t', totalCodeLists);
console.log('Total candidate code list members', '\t', totalCodeListMembers);
console.log('Total candidate code lists with at least one assignment property', '\t', totalCodeListWithAtLeastOneAssignmentProperty);
console.log('Total candidate code lists with at least one assignment property', '\t', totalCodeLists - totalCodeListWithAtLeastOneAssignmentProperty);

