export const SPARQL_ENDPOINT_URL = 'https://lov.linkeddata.es/dataset/lov/sparql';
export const prefixes = {
  vann:     'http://purl.org/vocab/vann/',
  voaf:     'http://purl.org/vocommons/voaf#',
  rdfs:     'http://www.w3.org/2000/01/rdf-schema#',
  owl:      'http://www.w3.org/2002/07/owl#',
  skos:     'http://www.w3.org/2004/02/skos/core#',
  rdf:      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
};

// export const reversePrefixes = {};
// Object.keys(prefixes).forEach((prefix) => {
//   reversePrefixes[prefixes[prefix]] = prefix;
// });

export const PREFIXES = Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n') + '\n';

//export const FROMS = Object.keys(reversePrefixes).map((rp) => `FROM <${rp.slice(0, -1)}>\nFROM <${rp}>`).join('\n') + '\n';

export const getQueryVocabs = () => `
SELECT DISTINCT ?vocabPrefix ?vocabURI {
 	GRAPH <https://lov.linkeddata.es/dataset/lov> {
 	 	?vocabURI a voaf:Vocabulary.
 	 	?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
  }
}
ORDER BY ?vocabPrefix
`;

export const getQueryIris = () => `
SELECT DISTINCT ?vocabURI ?vocabLabel (COUNT (?class) AS ?nClass) (COUNT (?ind) AS ?nInd) {
  ?vocabURI a voaf:Vocabulary.
  ?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
  OPTIONAL { 
    ?vocabURI rdfs:label ?vocabLabel .
    FILTER(LANGMATCHES(LANG(?vocabLabel), 'en') || LANGMATCHES(LANG(?vocabLabel), ''))
  }
  ?class a owl:Class .
  ?class rdfs:isDefinedBy ?vocabURI .
  OPTIONAL {
    ?ind a ?class .
  }
} GROUP BY ?vocabURI ?vocabLabel ORDER BY DESC(?nClass)
`;

export const getQueryFragmentInstances = (s, p, o) => `
SELECT DISTINCT ?s ?p ?o
WHERE {
  BIND(<${p.value}> AS ?p) .
  ?s a <${s.value}> .
  ${o.value.startsWith('http://www.w3.org/2001/XMLSchema#') ? '' : `?o a <${o.value}> .`}
  ?s ?p ?o .
}
#LIMIT 25
`;
export const getQueryConnectedSchemas = (iri) => `
SELECT 
?s ?sp ?sd ?p ?o ?op ?od
FROM <http://purl.org/dc/terms/>
FROM <http://purl.org/vocab/vann/>
FROM <http://www.w3.org/2004/02/skos/core>
FROM <http://purl.org/dc/elements/1.1/>
FROM <http://creativecommons.org/ns>
FROM <http://xmlns.com/foaf/0.1/>
FROM <http://schema.org/>
FROM <http://www.w3.org/ns/prov#>
FROM <${iri}>
WHERE {
  ?p rdfs:isDefinedBy <${iri}> .
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