const fs = require('fs');
const data = require('../aggregate-data/2019-07-20_lov-analyzer-results.json');
const vocabs = Object.keys(data).map((vocabIri) => {
    const vocab = data[vocabIri];
    let nCodes = 0;
    const codeListIris = Object.keys(vocab);
    codeListIris.forEach((codeListIri) => {
        nCodes += parseFloat(vocab[codeListIri].instances);
    });
    return { iri: vocabIri, nCodeLists: codeListIris.length, nCodes: nCodes };
});

vocabs.sort((a, b) => {
    return a.nCodeLists - b.nCodeLists;
    // return a.nCodes - b.nCodes;
});

vocabs.forEach((vocab) => {
    console.log(vocab.iri, vocab.nCodeLists, vocab.nCodes);
});
