# IGA-HYBRID

## Pattern-based Detection, Extraction and Analysis of Code Lists in Ontologies and Vocabularies
This repository contains
- [./app](./app) - the implementation of a web application that assists in browsing, analyzing and extracting code lists from RDF ontologies and vocabularies using SPAQRL queries
- [./aggregate](./aggregate), [./cube-analysis](./cube-analysis) - the analysis results and the code to reproduce them
- [./codelists](./codelists) - the extracted code list data and the code to reproduce it, this sub-project is dependent on the results from [./aggregate](./aggregate), please make sure to visit it first

## Implemented SPARQL queries in Code List Analyzer (./app)
Use the web application that provides an interface for the workflow
- https://fcp.vse.cz/iga-hybrid
<!-- - DEV: https://nvbach91.github.io/iga-hybrid -->

The SPARQL queries below can be run also manually at: 
1. https://fcp.vse.cz/blazegraphpublic/#query (this is the LOV dataset downloaded from https://lov.linkeddata.es)
    - select the `lovXXXXXXXX` namespace in the `namespaces` tab, XXXXXXXX is the date when the LOV dataset was downloaded (there may be multiple LOV datasets with different dates)
    - SPARQL endpoint: `https://fcp.vse.cz/blazegraphpublic/namespace/lovXXXXXXXX/sparql`
2. https://lov.linkeddata.es/dataset/lov/sparql (current LOV dataset)
    - SPARQL endpoint: `https://lov.linkeddata.es/dataset/lov/sparql`
3. EXPERIMENTAL: `http://dbpedia.org/sparql` (see DBPedia specific queries)
4. any of your custom SPARQL endpoints


## Common prefixes used in the SPARQL queries
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

## Enhancement queries

### Q0: Add rdfs:isDefinedBy to classes based on the owl:Ontology IRI (make data in consistent for the SPARQL queries)
This query is used to enhance vocabularies that are missing the `rdfs:isDefinedBy` property in their classes or when the `rdfs:isDefinedBy` values are not the same as the `owl:Ontology` IRI
```sparql
INSERT {
  GRAPH ?g {
    ?c rdfs:isDefinedBy ?g .
  } 
}
WHERE {
  # specify the vovabulary IRI here
  BIND(<http://purl.obolibrary.org/obo/go.owl> AS ?g)
  GRAPH ?g {
    VALUES ?class { owl:Class rdfs:Class }
    ?c a ?class .
  }
}
```

## General queries

### Q1: Query to get a list of vocabularies with class count and class instance count
```sparql
SELECT DISTINCT ?vocab
                (GROUP_CONCAT(DISTINCT ?vp;separator=" || ") AS ?vocabPrefixes)
                (GROUP_CONCAT(DISTINCT ?vl;separator=" || ") AS ?vocabLabels)
                (COUNT (DISTINCT ?c)  AS ?nClass)
                #(COUNT (DISTINCT ?sc) AS ?nSubClass)
                (COUNT (DISTINCT ?i)  AS ?nIns)
WHERE {
  ?vocab a voaf:Vocabulary .
  OPTIONAL { ?vocab vann:preferredNamespacePrefix ?vp }
  OPTIONAL {
    VALUES ?vocabLabelProp {
      rdfs:label dc:title dcterms:title skos:prefLabel
    }
    ?vocab ?vocabLabelProp ?vl .
    FILTER(LANGMATCHES(LANG(?vl), 'en') || LANGMATCHES(LANG(?vl), ''))
  }
  OPTIONAL {
    GRAPH ?vocab {
      VALUES ?class { owl:Class rdfs:Class } .
      ?c a ?class .
      OPTIONAL { ?i a ?c }
      #OPTIONAL { ?sc rdfs:subClassOf ?c }
    }
  }
} 
GROUP BY ?vocab
ORDER BY DESC(?nIns)
```


## Code list analysis queries

### Q2: Query to get the number of instances of each class in an ontology with their range properties and domain classes
```sparql
SELECT DISTINCT ?d ?p ?c (COUNT(DISTINCT ?i) AS ?ni)
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  VALUES ?class { owl:Class rdf:Class }
  ?c a ?class .
  #?i a|rdfs:subClassOf ?c .
  ?i a ?c .
  OPTIONAL { 
    ?p rdfs:range ?c . 
    OPTIONAL { ?p rdfs:domain ?d }
  }
} GROUP BY ?d ?p ?c ORDER BY DESC(?ni)
```

### Q3: Query to get a list of candidate code list members and whether they are tagged with skos:Concept and skos:inScheme
```sparql
SELECT DISTINCT ?i ?sc ?scs #?l
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  #OPTIONAL {
  #  VALUES ?lp { rdfs:label dc:title dcterms:title skos:prefLabel }
  #  ?i ?lp ?l . 
  #}
  #?i a|rdfs:subClassOf <http://rdf.muninn-project.org/ontologies/military#Rank> .
  ?i a <http://rdf.muninn-project.org/ontologies/military#Rank> .
  OPTIONAL {
    BIND(skos:Concept AS ?sc) .
    ?i a ?sc .
  }
  OPTIONAL {
    ?i skos:inScheme ?scs .
    ?scs a skos:ConceptScheme
  }
}
ORDER BY ?i
```

### Q4: Query to get candidate code list structure
```sparql
SELECT DISTINCT ?cp ?c ?cn ?i1 ?i1n ?p ?i2 ?i2n
FROM <http://rdf.muninn-project.org/ontologies/military>
WHERE {
  VALUES ?cp { rdf:type }# rdfs:subClassOf
  BIND(<http://rdf.muninn-project.org/ontologies/military#Rank> AS ?c) .
  ?i1 ?cp ?c .
  VALUES ?lp { rdfs:label dc:title dcterms:title skos:prefLabel }
  OPTIONAL { ?c ?lp ?cn . FILTER(LANGMATCHES(LANG(?cn), 'en')) }
  OPTIONAL { ?i1 ?lp ?i1n . FILTER(LANGMATCHES(LANG(?i1n), 'en'))}
  OPTIONAL {
    ?i2 ?cp ?c .
    ?i1 ?p ?i2 .
    OPTIONAL { ?i2 ?lp ?i2n . FILTER(LANGMATCHES(LANG(?i2n), 'en')) }
  }
}
ORDER BY ?i1
```

### Q5: Query to get a list of properties that connect class instances and the number of instances on both sides
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

## Experimental queries

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


## Experimental DBpedia-specific queries

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
