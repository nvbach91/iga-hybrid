# Download code lists from SPARQL endpoint

- prerequisites: node.js 16.18.0
- usage: `$> node download.js`
- config: `./config.json`

## endpoints to download from
specify the endpoint url in the `./config.json` file

### Endpoint 1: https://lov.linkeddata.es/dataset/lov/sparql
example results:
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


### Endpoint 2: http://localhost/boss-blazegraph-s/v1/namespace/lov20221023/sparql
example results:
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