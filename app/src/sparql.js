export const SPARQL_ENDPOINT_URL = 'https://lov.linkeddata.es/dataset/lov/sparql';
export const PREFIXES = `
PREFIX vann:<http://purl.org/vocab/vann/>
PREFIX voaf:<http://purl.org/vocommons/voaf#>
PREFIX dcterms:<http://purl.org/dc/terms/>
PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:<http://www.w3.org/2002/07/owl#>
PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
PREFIX military:<http://rdf.muninn-project.org/ontologies/military#>
PREFIX gr:<http://purl.org/goodrelations/v1#>
PREFIX ce:<http://www.ebusiness-unibw.org/ontologies/consumerelectronics/v1#>
PREFIX sport:<http://www.bbc.co.uk/ontologies/sport/>
PREFIX phdd:<http://rdf-vocabulary.ddialliance.org/phdd#>
PREFIX seas:<https://w3id.org/seas/>
PREFIX dk:<http://www.data-knowledge.org/dk/>
PREFIX org:<http://www.w3.org/ns/org#>
PREFIX dbo:<http://dbpedia.org/ontology/>
PREFIX time:<http://www.w3.org/2006/time#>
PREFIX muninn:<http://rdf.muninn-project.org/ontologies/>
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
} GROUP BY ?vocabURI ?vocabLabel ORDER BY DESC(?nClass)`;

export const getQueryConnectedSchemas = (iri) => `
SELECT 
?s ?sp ?sd ?p ?o ?op ?od
FROM <http://dbpedia.org/ontology/>
FROM <http://rdf.muninn-project.org/ontologies/military>
FROM <http://www.ebusiness-unibw.org/ontologies/consumerelectronics/v1>
FROM <http://xmlns.com/foaf/0.1/>
FROM <http://www.bbc.co.uk/ontologies/sport>
FROM <http://rdf-vocabulary.ddialliance.org/phdd>
FROM <https://w3id.org/seas/TimeOntology>
FROM <http://www.data-knowledge.org/dk/>
{
  ?p rdfs:isDefinedBy <${iri}> .
  VALUES ?pt { owl:ObjectProperty owl:DatatypeProperty } .
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