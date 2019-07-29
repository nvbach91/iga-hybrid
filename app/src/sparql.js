import { shortenIri } from './utils';

export const getEndpointUrl = (vocab) => {
  switch (vocab) {
    case 'http://dbpedia.org': return 'https://dbpedia.org/sparql';
    default: return 'https://lov.linkeddata.es/dataset/lov/sparql';
  }
};

export const prefixes = {
  vann:     'http://purl.org/vocab/vann/',
  voaf:     'http://purl.org/vocommons/voaf#',
  rdfs:     'http://www.w3.org/2000/01/rdf-schema#',
  owl:      'http://www.w3.org/2002/07/owl#',
  skos:     'http://www.w3.org/2004/02/skos/core#',
  rdf:      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dc:       'http://purl.org/dc/terms/',
  dcmit:    'http://purl.org/dc/dcmitype/',
};

// export const reversePrefixes = {};
// Object.keys(prefixes).forEach((prefix) => {
//   reversePrefixes[prefixes[prefix]] = prefix;
// });

export const PREFIXES = Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n') + '\n';

export const FROMS = ''; /*`
#FROM <http://purl.org/dc/terms/>
#FROM <http://purl.org/vocab/vann/>
#FROM <http://www.w3.org/2004/02/skos/core>
#FROM <http://purl.org/dc/elements/1.1/>
#FROM <http://creativecommons.org/ns>
#FROM <http://xmlns.com/foaf/0.1/>
#FROM <http://schema.org/>
#FROM <http://www.w3.org/ns/prov#>
#FROM <http://www.w3.org/2002/07/owl#>
`;*/
//Object.keys(reversePrefixes).map((rp) => `FROM <${rp.slice(0, -1)}>\nFROM <${rp}>`).join('\n') + '\n';

export const getQueryVocabs = () => `
SELECT DISTINCT ?vocabPrefix ?vocabURI {
 	GRAPH <https://lov.linkeddata.es/dataset/lov> {
 	 	?vocabURI a voaf:Vocabulary.
 	 	?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
  }
}
ORDER BY ?vocabPrefix
`;

export const getQueryVocabStats = () => `
SELECT DISTINCT ?vocabURI ?vocabLabel (COUNT (?class) AS ?nClass) (COUNT (?ind) AS ?nInd) {
  ?vocabURI a voaf:Vocabulary.
  ?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
  OPTIONAL { 
    ?vocabURI rdfs:label ?vocabLabel .
    FILTER(LANGMATCHES(LANG(?vocabLabel), 'en') || LANGMATCHES(LANG(?vocabLabel), ''))
  }
  VALUES ?c { owl:Class rdf:Class } .
  ?class a ?c .
  ?class rdfs:isDefinedBy ?vocabURI .
  OPTIONAL {
    ?ind a ?class .
  }
} GROUP BY ?vocabURI ?vocabLabel ORDER BY DESC(?nInd)
`;

export const getQueryFragmentInstancesCount = (fragment) => `
SELECT (COUNT(DISTINCT *) AS ?n)
WHERE {
  BIND(<${fragment.p.value}> AS ?p) .
  ?s a <${fragment.s.value}> .
  ${fragment.o.value.startsWith('http://www.w3.org/2001/XMLSchema#') ? '' : `?o a <${fragment.o.value}> .`}
  ?s ?p ?o .
}
`;

export const getQueryFragmentInstances = (fragment) => `
SELECT DISTINCT ?s ?p ?o
WHERE {
  BIND(<${fragment.p.value}> AS ?p) .
  ?s a <${fragment.s.value}> .
  ${fragment.o.value.startsWith('http://www.w3.org/2001/XMLSchema#') ? '' : `?o a <${fragment.o.value}> .`}
  ?s ?p ?o .
}
`;
export const getQuerySchemaFragments = (vocabIri) => `
SELECT DISTINCT
?s ?sp ?sd ?p ?o ?op ?od
${FROMS}

FROM <${vocabIri}>
WHERE {
  ?p rdfs:isDefinedBy <${vocabIri}> .
  VALUES ?pt { owl:ObjectProperty owl:DatatypeProperty rdf:Property } .
  ?p a ?pt .
  OPTIONAL {
    ?p rdfs:domain ?s .
    OPTIONAL {
      ?p rdfs:subPropertyOf ?op .
        OPTIONAL { ?op rdfs:range ?od . }
    }
  }
  OPTIONAL {
    ?p rdfs:range ?o .
    OPTIONAL {
      ?p rdfs:subPropertyOf ?sp .
      OPTIONAL { ?sp rdfs:domain ?sd . }
    }
  }
}
ORDER BY ?s
`;

export const getQueryMetadata = (iri) => `
SELECT ?label ?ontology ?comment ?definition WHERE {
  BIND (<${iri}> AS ?entity).
  ?entity rdfs:label ?label .
  OPTIONAL { ?entity rdfs:isDefinedBy ?ontology }
  OPTIONAL { ?entity rdfs:comment ?comment }
  OPTIONAL { ?entity skos:definition ?definition }
}
`;

export const getQueryClassInstanceCounts = (vocabIri) => `
SELECT DISTINCT ?d ?p ?c (COUNT(DISTINCT ?i) AS ?n)
FROM <${vocabIri}> 
WHERE {
  ?c a owl:Class .
  ?i a ?c .
  OPTIONAL { 
    ?p rdfs:range ?c . 
    OPTIONAL {
    	?p rdfs:domain ?d .
    }
  }
}
GROUP BY ?d ?p ?c
ORDER BY ?c
`;

export const getQueryCodeListInstances = (codeListIri, vocabIri) => `
SELECT DISTINCT ?i ?skosConcept
FROM <${vocabIri}> 
WHERE {
  ?i a <${codeListIri}> .
  OPTIONAL {
    BIND(skos:Concept AS ?skosConcept) .
    ?i a ?skosConcept .
  }
}
ORDER BY ?i
`;

export const getQueryCodeListStructure = (codeListIri, vocabIri) => `
SELECT DISTINCT ?c ?cn ?i1 ?i1n ?p ?i2 ?i2n
${vocabIri ? FROMS : ''}
${vocabIri ? `FROM <${vocabIri}>` : ''}
WHERE {
  VALUES ?lp { rdfs:label }
  BIND(<${codeListIri}> AS ?c) .
  ?i1 a ?c .
  OPTIONAL { ?c ?lp ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 ?lp ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
    ?i2 a ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 ?lp ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
`;

export const getQueryCodeListConstruct = (codeListIri, vocabIri) => {
  let vocabPrefixHash = '';
  let vocabPrefixSlash = '';
  if (!vocabIri.endsWith('#') && !vocabIri.endsWith('/')) {
    vocabPrefixHash = `PREFIX ${shortenIri(`${vocabIri}#`)}: <${vocabIri}#>`;
    vocabPrefixSlash = `PREFIX ${shortenIri(`${vocabIri}/`)}: <${vocabIri}/>`;
  } else {
    if (vocabIri.endsWith('#')) {
      vocabPrefixHash = `PREFIX ${shortenIri(vocabIri)}: <${vocabIri}>`;
    } else if (!vocabIri.endsWith('/')) {
      vocabPrefixHash = `PREFIX ${shortenIri(`${vocabIri}#`)}: <${vocabIri}#>`;
    }
    if (vocabIri.endsWith('/')) {
      vocabPrefixSlash = `PREFIX ${shortenIri(vocabIri)}: <${vocabIri}>`;
    } else if (!vocabIri.endsWith('#')) {
      vocabPrefixSlash = `PREFIX ${shortenIri(`${vocabIri}/`)}: <${vocabIri}/>`;
    }
  }
  if (vocabPrefixHash.startsWith('PREFIX http')) {
    vocabPrefixHash = '';
  }
  if (vocabPrefixSlash.startsWith('PREFIX http')) {
    vocabPrefixSlash = '';
  }
  return (
`
${vocabPrefixHash}
${vocabPrefixSlash}
CONSTRUCT { 
  ?c a owl:Class .
  ?c rdfs:label ?cn .
  ?cp a owl:ObjectProperty .
  ?cp rdfs:range ?c .
  ?cp rdfs:label ?cpn .
  ?cp rdfs:domain ?cd .
  ?cd a owl:Class .
  ?cd rdfs:label ?cdn .
  ?i1 a ?c .
  ?i1 a ?skosConcept .
  ?i1 rdfs:label ?i1n .
  ?i2 a ?c .
  ?i2 rdfs:label ?i2n .
  ?i1 ?p ?i2 .
}
${vocabIri ? FROMS : ''}
${vocabIri ? `FROM <${vocabIri}>` : ''}
WHERE {
  VALUES ?lp { rdfs:label }
  BIND(<${codeListIri}> AS ?c) .
  ?i1 a ?c .
  OPTIONAL { 
    ?cp rdfs:range ?c . 
    OPTIONAL { 
      ?cp rdfs:label ?cpn .
      ?cp rdfs:domain ?cd .
      OPTIONAL { ?cd rdfs:label ?cdn } 
    }
  }
  OPTIONAL { BIND(skos:Concept AS ?skosConcept) . ?i1 a ?skosConcept . }
  OPTIONAL { ?c ?lp ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 ?lp ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
    ?i2 a ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 ?lp ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
`);
};

export const getDBpediaQueryBroadestConcepts = () => `
SELECT ?c (COUNT(DISTINCT ?i) AS ?n) {
  ?c a skos:Concept .
  FILTER NOT EXISTS {
    ?b a skos:Concept .
    ?c skos:broader ?b .
  }
  ?i skos:broader ?c .
}
GROUP BY ?c
#HAVING (COUNT(DISTINCT ?i) < 20)
ORDER BY DESC(?n)
`;

export const getDBpediaQueryCodeListMembers = (iri) => `
SELECT DISTINCT ?i ?skosConcept
WHERE {
  ?i skos:broader <${iri}> .
  ?i a ?skosConcept .
}
`;

export const getDBpediaQueryCodeListStructure = (codeListIri) => `
SELECT DISTINCT ?c ?cn ?i1 ?i1n ?p ?i2 ?i2n
WHERE {
  VALUES ?lp { rdfs:label }
  BIND(<${codeListIri}> AS ?c) .
  ?i1 skos:broader ?c .
  OPTIONAL { ?c ?lp ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 ?lp ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
  	?i2 skos:broader ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 ?lp ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
`;
export const getDBpediaQueryCodeListConstruct = (codeListIri) => `
CONSTRUCT {
  ?c a owl:Class .
  ?c rdfs:label ?cn .
  ?i1 a ?c .
  ?i1 a ?skosConcept .
  ?i1 rdfs:label ?i1n .
  ?i2 a ?c .
  ?i2 rdfs:label ?i2n .
  ?i1 ?p ?i2 .
} 
WHERE {
  VALUES ?lp { rdfs:label }
  BIND(<${codeListIri}> AS ?c) .
  ?i1 skos:broader ?c .
  OPTIONAL { ?c ?lp ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 ?lp ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
  	?i2 skos:broader ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 ?lp ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
`;

/*
SELECT DISTINCT ?i ?skosConcept
WHERE {
  ?i skos:broader <http://dbpedia.org/resource/Category:Norwegian_people_by_occupation> .
  OPTIONAL {
    BIND(skos:Concept AS ?skosConcept) .
    ?i a ?skosConcept .
  }
}
*/