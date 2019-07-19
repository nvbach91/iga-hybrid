# IGA-HYBRID
Repository for the internal grant project involving hybrid modeling of RDF knowledge bases

## LOV experimental queries to find hybrid knowledge representations
Run these queries at https://lov.linkeddata.es/dataset/lov/sparql

### prefixes
```sparql
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
```

### get list of ontologies with number of classes
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

### get list of ontologies with number of classes and number of class instances
```sparql
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
} GROUP BY ?vocabURI ?vocabLabel ORDER BY ?vocabURI
```


### number of instances per class
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

### class relationships
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


### get connected schemas in an ontology
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
## Prefixes
```
PREFIX vann: <http://purl.org/vocab/vann/>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
```

## Get the number of class instances in each ontology
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


## Get the number of instances of each class in an ontology with their range properties and domain classes
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
```

## Get all class instances with their class in an ontology, optionally find out if the instance is a skos:Concept
```sparql
SELECT DISTINCT ?c ?i
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?c a owl:Class .
  ?i a ?c .
  OPTIONAL {
    ?i a skos:Concept .
  }
}
```

## Get a list of code list members and whether it's a skos:Concept
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

## Get list of properties that connect class instances
```sparql
SELECT DISTINCT ?p
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  ?c1 a owl:Class .
  ?c2 a owl:Class .
  ?i1 a ?c1 .
  ?i2 a ?c2 .
  ?i1 ?p ?i2 .
}
```

## Get code list structure
```sparql
SELECT DISTINCT ?c ?i1 ?p ?i2 
FROM <http://rdf.muninn-project.org/ontologies/military> 
WHERE {
  BIND(<http://rdf.muninn-project.org/ontologies/military#MilitaryTrade> AS ?c) .
  ?i1 a ?c .
  OPTIONAL {
    ?i2 a ?c .
    ?i1 ?p ?i2 .
  }
}
ORDER BY ?i1
```
