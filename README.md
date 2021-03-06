# IGA-HYBRID
Repository for the internal grant project involving hybrid modeling of RDF knowledge bases

## Queries to find hybrid knowledge representations
Run these queries at 
- https://lov.linkeddata.es/dataset/lov/sparql
- https://fcp.vse.cz/blazegraph/#query
- http://dbpedia.org/sparql

## Or use this web client that will do it for you
- PROD: https://fcp.vse.cz/iga-hybrid
- DEV: https://nvbach91.github.io/iga-hybrid


### Prefixes
```sparql
PREFIX vann:     <http://purl.org/vocab/vann/>
PREFIX voaf:     <http://purl.org/vocommons/voaf#>
PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:      <http://www.w3.org/2002/07/owl#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf:      <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dcterms:  <http://purl.org/dc/terms/>
PREFIX dc:       <http://purl.org/dc/elements/1.1/>
PREFIX dcmit:    <http://purl.org/dc/dcmitype/>
```

# Enhancement queries
### Q0: Add rdfs:isDefinedBy to classes based on owl:Ontology (make data in consistent for SPARQL queries)
This query is used to enhance custom own data that is not annotated in a similar way as data in LOV.
Run this query if custom dataset doesn't have `rdfs:isDefinedBy` in classes or they are not the same as the `owl:Ontology` instance
```sparql
INSERT {
  GRAPH ?g {
    ?c rdfs:isDefinedBy ?g .
  } 
}
WHERE {
  # specify the ontology IRI here
  BIND(<http://purl.obolibrary.org/obo/go.owl> AS ?g)
  GRAPH ?g {
    VALUES ?t { owl:Class rdf:Class }
    ?c a owl:Class .
  }
}
```

# General queries
### Q1: Get a list of ontologies with number of classes and number of class instances
```sparql
SELECT DISTINCT ?vocabURI ?vocabPrefix ?vocabLabel (COUNT (?class) AS ?nClass) (COUNT (?ind) AS ?nInd) {
    ?vocabURI a voaf:Vocabulary.
    ?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
    OPTIONAL { 
        ?vocabURI rdfs:label|dc:title|dcterms:title ?vocabLabel .
        FILTER(LANGMATCHES(LANG(?vocabLabel), 'en') || LANGMATCHES(LANG(?vocabLabel), ''))
    }
    ?class a owl:Class .
    ?class rdfs:isDefinedBy ?vocabURI .
    OPTIONAL {
        ?ind a ?class .
    }
} GROUP BY ?vocabURI ?vocabPrefix ?vocabLabel ORDER BY ?vocabURI
```


### QX: Get list of ontologies with number of classes
```sparql
SELECT DISTINCT ?vocabURI ?vocabLabel (COUNT (?class) AS ?nClass) {
    ?vocabURI a voaf:Vocabulary.
    ?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.
    ?class a owl:Class .
    ?class rdfs:isDefinedBy ?vocabURI .
    OPTIONAL { ?vocabURI rdfs:label ?vocabLabel }
    FILTER(LANGMATCHES(LANG(?vocabLabel), 'en'))
} GROUP BY ?vocabURI ?vocabLabel ORDER BY ?vocabURI
```


### QX: Number of instances per class
```sparql
SELECT ?class (COUNT(?ind) AS ?nInd) 
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?class a owl:Class .
  OPTIONAL {
    ?ind a ?class
  }
} 
GROUP BY ?class
#LIMIT 10
```


### QX: Class relationships
```sparql
SELECT ?s ?p ?o {
  BIND(<http://rdf.muninn-project.org/ontologies/military> AS ?graph)
  GRAPH ?graph {
    ?p a owl:ObjectProperty .
    OPTIONAL {
      #?s rdfs:isDefinedBy ?graph .
      ?p rdfs:domain ?s .
    }
    OPTIONAL {
      #?o rdfs:isDefinedBy ?graph .
      ?p rdfs:range ?o .
    }
  }
}
```


### QX: Get connected schema fragments in an ontology
```sparql
SELECT DISTINCT
?s ?sp ?sd ?p ?o ?op ?od
FROM <http://purl.org/dc/terms/>
FROM <http://purl.org/vocab/vann/>
FROM <http://www.w3.org/2004/02/skos/core>
FROM <http://purl.org/dc/elements/1.1/>
FROM <http://creativecommons.org/ns>
FROM <http://xmlns.com/foaf/0.1/>
FROM <http://schema.org/>
FROM <http://www.w3.org/ns/prov#>

FROM <http://rdf.muninn-project.org/ontologies/military> #replace your vocab iri
WHERE {
  ?p rdfs:isDefinedBy <http://rdf.muninn-project.org/ontologies/military> .
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
```


# Code list analysis

### QX: Get the number of class instances in each ontology
```sparql
SELECT DISTINCT 
?v (COUNT(?i) as ?n) 
WHERE {
  ?v a voaf:Vocabulary.
  ?c a owl:Class .
  ?i a ?c .
  ?c rdfs:isDefinedBy ?v .
  ?i rdfs:isDefinedBy ?v .
} 
GROUP BY ?v
ORDER BY DESC(?n)
```


### Q2: Get the number of instances of each class in an ontology with their range properties and domain classes
```sparql
SELECT ?d ?p ?c (COUNT(DISTINCT ?i) AS ?n)
FROM <http://rdf.muninn-project.org/ontologies/military> 
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
```


### QX: Get all class instances with their class in an ontology, optionally find out if the instance is a skos:Concept
```sparql
SELECT DISTINCT ?c ?i ?skosConcept
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?c a owl:Class .
  ?i a ?c .
  OPTIONAL {
    BIND(skos:Concept AS ?skosConcept) .
    ?i a ?skosConcept .
  }
}
```


### Q3: Get a list of code list members and whether it's a skos:Concept
```sparql
SELECT DISTINCT ?i ?skosConcept
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?i a <http://rdf.muninn-project.org/ontologies/military#Soldier> .
  OPTIONAL {
    BIND(skos:Concept AS ?skosConcept) .
    ?i a ?skosConcept .
  }
}
```


### Q4: Get code list structure
```sparql
SELECT DISTINCT ?c ?i1 ?p ?i2 
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  BIND(<http://rdf.muninn-project.org/ontologies/military#MilitaryAppointment> AS ?c) .
  ?i1 a ?c .
  OPTIONAL { ?c rdfs:label ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 rdfs:label ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
    ?i2 a ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 rdfs:label ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
```


### Q5: Get list of properties that connect class instances and the number of instances on both sides
```sparql
SELECT (COUNT(DISTINCT ?i1) AS ?ni1) ?p (COUNT(DISTINCT ?i2) AS ?ni2)
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?c1 a owl:Class .
  ?c2 a owl:Class .
  ?i1 a ?c1 .
  ?i2 a ?c2 .
  ?i1 ?p ?i2 .
}
GROUP BY ?p
```

# DBpedia-specific queries

### Get a list of broadest skos:Concept instances
```sparql
SELECT ?c (COUNT(DISTINCT ?i) AS ?n) {
  ?c a skos:Concept .
  FILTER NOT EXISTS {
    ?b a skos:Concept .
    ?c skos:broader ?b .
  }
  ?i skos:broader ?c .
}
GROUP BY ?c
ORDER BY DESC(?n)
```

### Get code list members and their skos:Concept status
```sparql
SELECT DISTINCT ?i ?skosConcept
WHERE {
  ?i skos:broader <http://dbpedia.org/resource/Category:Research_vessels_of_the_United_States> .
  ?i a ?skosConcept .
}
```

### Get code list structure 
```sparql
SELECT DISTINCT ?c ?cn ?i1 ?i1n ?p ?i2 ?i2n
WHERE {
  VALUES ?lp { rdfs:label }
  BIND(<http://dbpedia.org/resource/Category:Research_vessels_of_the_United_States> AS ?c) .
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
```