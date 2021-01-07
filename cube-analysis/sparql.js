const prefixes = {
  vann:     'http://purl.org/vocab/vann/',
  voaf:     'http://purl.org/vocommons/voaf#',
  rdfs:     'http://www.w3.org/2000/01/rdf-schema#',
  owl:      'http://www.w3.org/2002/07/owl#',
  skos:     'http://www.w3.org/2004/02/skos/core#',
  rdf:      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dcterms:  'http://purl.org/dc/terms/',
  dc:       'http://purl.org/dc/elements/1.1/',
  dcmit:    'http://purl.org/dc/dcmitype/',
};

const PREFIXES = `${Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n')}\n`;

const QUERY_CODELISTS_IN_ONTOLOGY = (ontology) => `${PREFIXES}
SELECT ?d ?p ?c (COUNT(DISTINCT ?i) AS ?n)
FROM <${ontology}>
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

const QUERY_INSTANCES_IN_ONTOLOGY_WITH_CLASS = (ontology) => `${PREFIXES}
SELECT DISTINCT ?i ?c ?skosConcept
FROM <${ontology}>
WHERE {
  VALUES (?class) { (owl:Class) (rdfs:Class) }
  ?c a ?class .
  ?i a ?c .
  OPTIONAL {
    BIND(skos:Concept AS ?skosConcept) .
    ?i a ?skosConcept .
  }
}
ORDER BY ?c
`;


const QUERY_INSTANCES_IN_CODELIST_OF_ONTOLOGY = (ontology, codeList) => `${PREFIXES}
SELECT DISTINCT ?i
FROM <${ontology}>
WHERE {
  ?i a <${codeList}> .
}
`;

const QUERY_INSTANCES_IN_ONTOLOGY = (ontology) => `${PREFIXES}
SELECT DISTINCT ?i
FROM <${ontology}>
WHERE {
  {
    VALUES ?class { owl:Class rdfs:Class }
    ?c a ?class .
    ?i a ?c .
  }
  UNION
  {
    ?i skos:inScheme ?s .
  }
}
`;

const ignoredRdfClasses = [
  'owl:Class', 'rdfs:Class', 'owl:ObjectProperty', 'owl:NamedIndividual', 
  'owl:Ontology', 'voaf:Vocabulary', 'owl:Thing', 'owl:DatatypeProperty', 
  'rdf:Property', 'skos:ConceptScheme', 'owl:DeprecatedClass', 'rdfs:Resource',
  'owl:AnnotationProperty', 'owl:OntologyProperty',
];

const QUERY_CLASSES_OF_INSTANCE = (ontology, instance) => `${PREFIXES}
SELECT DISTINCT ?c ?s
FROM <${ontology}>
WHERE {
  {
    <${instance}> a ?c .
    FILTER(?c NOT IN (${ignoredRdfClasses.join(', ')}))
  }
  UNION
  {
    <${instance}> skos:inScheme ?s .
  }
}
`;

module.exports = {
  QUERY_CODELISTS_IN_ONTOLOGY,
  QUERY_INSTANCES_IN_ONTOLOGY_WITH_CLASS,
  QUERY_INSTANCES_IN_CODELIST_OF_ONTOLOGY,
  QUERY_INSTANCES_IN_ONTOLOGY,
  QUERY_CLASSES_OF_INSTANCE,
};
