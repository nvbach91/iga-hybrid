# Extracting code lists from LOV dataset SPARQL endpoint

### Installation
- Node.js 18.12.0
```
$> npm install -g yarn
$> yarn
```

### Extract code lists
- Run `$> node extract-codelists.js` to get the results
- Result is a bunch of files representing the extracted code lists, the files are renamed in a way so they can be stored on the disk
  - `[c]` replaces colon `:`
  - `[s]` replaces slash `/`
  - `[h]` replaces hash `#`
- you can change the endpoint URL in the `./config.json` file

### Endpoint 1 (prefered): https://lov.linkeddata.es/dataset/lov/sparql
Result sample:
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
Result sample:
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

### A working code lists SPARQL endpoint prepared for you
- workbench: https://fcp.vse.cz/blazegraphpublic/#namespaces (choose the endpoint named `codelists`)
- SPARQL endpoint: `https://fcp.vse.cz/blazegraphpublic/namespace/codelists/sparql`

### Queries to try on this SPARQL endpoint:
- Get a list of code lists and their assignment properties
```sparql
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
- Get all code lists and their members
```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT DISTINCT ?ontology ?codeList ?code WHERE {
  ?codeList a skos:ConceptScheme .
  ?code skos:inScheme ?codeList .
  ?code rdfs:isDefinedBy ?ontology .
}
```

### Code lists overview data table for manual analysis
- https://github.com/nvbach91/iga-hybrid/tree/master/codelists/results

### Code lists graph schema + example
- https://drive.google.com/file/d/1VtlSmfxKMfY1XMMb05Zj6zgTyTWN7pbL

![image](https://user-images.githubusercontent.com/20724910/198905252-3b4a023b-d009-469d-9127-f0bbc36fe73d.png)


