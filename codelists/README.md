# Download code lists from LOV SPARQL endpoint
- prerequisites: node.js 16.18.0
- usage: `$> node download.js`
- config: `./config.json`
  - Specify one of the endpoint urls in the `./config.json` file

### Endpoint 1 (prefered): https://lov.linkeddata.es/dataset/lov/sparql
Result example:
```xml
<rdf:RDF
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
  <skos:Concept rdf:about="http://creativecommons.org/licenses/by/3.0/">
    <rdfs:label xml:lang="en">CC BY 3.0</rdfs:label>
    <skos:inScheme>
      <skos:ConceptScheme rdf:about="http://creativecommons.org/ns#License"/>
    </skos:inScheme>
  </skos:Concept>
</rdf:RDF>
```


### Endpoint 2: https://fcp.vse.cz/blazegraphpublic/namespace/lov20221023/sparql
Result example:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
	xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
	xmlns:skos="http://www.w3.org/2004/02/skos/core#"
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

<rdf:Description rdf:about="http://creativecommons.org/ns#License">
	<rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#ConceptScheme"/>
</rdf:Description>

<rdf:Description rdf:about="http://creativecommons.org/licenses/by/3.0/">
	<rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
	<skos:inScheme rdf:resource="http://creativecommons.org/ns#License"/>
	<rdfs:label xml:lang="en">CC BY 3.0</rdfs:label>
</rdf:Description>

</rdf:RDF>
```

### Upload these files to your triplestore
-  e.g. to Blazegraph using [nvbach91/blazegraph-upload](https://github.com/nvbach91/blazegraph-upload)

### Code lists SPARQL endpoint
- workbench: https://fcp.vse.cz/blazegraphpublic/#namespaces
- endpoint: https://fcp.vse.cz/blazegraphpublic/namespace/codelists/sparql

### Queries to try on this SPARQL endpoint:
- Get a list of code lists and their assignment properties
```sparql
# https://fcp.vse.cz/blazegraphpublic/#query
# namespace: codelists

PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?domainTerm ?assignmentProperty ?codeList ?ontology (COUNT(?code) AS ?nCodes) WHERE  {
  ?codeList a skos:ConceptScheme .
  ?codeList rdfs:isDefinedBy ?ontology .
  OPTIONAL {
    ?assignmentProperty rdfs:range ?codeList.
    OPTIONAL {
      ?assignmentProperty rdfs:domain ?domainTerm .
    }
  }
  OPTIONAL {
    ?code skos:inScheme ?codeList .
  }
}
GROUP BY ?domainTerm ?assignmentProperty ?codeList ?ontology
ORDER BY DESC(?nCodes)
```
- Get all code lists and their codes
```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?ontology ?codeList ?code WHERE  {
  ?codeList a skos:ConceptScheme .
  ?code skos:inScheme ?codeList .
  ?code rdfs:isDefinedBy ?ontology .
}
```

### Code lists overview data table
- https://github.com/nvbach91/iga-hybrid/tree/master/codelists/results
