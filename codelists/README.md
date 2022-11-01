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

### Full extraction query (with filters)
The filters were added to remove unfit code lists as a result of manual analysis of the data extracted by this same query without the filters
```js
const labelProps = 'rdfs:label|dc:title|dcterms:title|skos:prefLabel';
const commentProps = 'rdfs:comment|dc:description|dcterms:description';
const filterLangs = (v) => `FILTER(LANGMATCHES(LANG(${v}), "en") || LANGMATCHES(LANG(${v}), ""))`;
const createCodeListQuery = (codeListIri, vocabIri) => `
  ${Object.keys(prefixes).map((prefix) => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join('\n')}
  CONSTRUCT {
    ?codeList       a                   skos:ConceptScheme .
    ?code1          a                   skos:Concept .
    ?code1          skos:inScheme       ?codeList .
    ?codeList       rdfs:comment        ?codeListComment .
    ?codeList       rdfs:label          ?codeListLabel .
    ?code1          rdfs:comment        ?code1Comment .
    ?code1          rdfs:label          ?code1Label .
    ?code1          ?p                  ?code2 .
    ?code2          a                   skos:Concept .
    ?ap             rdfs:range          ?codeList . 
    ?ap             rdfs:domain         ?dt .
    ?ap             rdfs:label          ?apLabel .
    ?ap             rdfs:comment        ?apComment .
    ?ap             a                   ?apType .
    <${vocabIri}>   a                   owl:Ontology .
    ?codeList       rdfs:isDefinedBy    <${vocabIri}> .
    ?code1          rdfs:isDefinedBy    <${vocabIri}> .
    ?code2          rdfs:isDefinedBy    <${vocabIri}> .
  }
  FROM <${vocabIri}>
  WHERE {
    BIND(<${codeListIri}> AS ?codeList)
    ?code1 a ?codeList .
    FILTER NOT EXISTS { ?code1 a owl:Ontology }
    
    FILTER(!ISBLANK(?code1))
    FILTER(?codeList NOT IN (
      <http://purl.org/semsur/RegularPaper>,
      <http://www.w3.org/2000/10/swap/pim/contact#Person>
    ))
    VALUES ?class { owl:Class rdfs:Class dcterms:Agent dc:Agent }
    FILTER NOT EXISTS { ?codeList rdfs:subClassOf* ?class }
    FILTER NOT EXISTS { ?codeList rdfs:subClassOf* rdf:Property }
    FILTER NOT EXISTS { ?codeList a rdf:Property }

    OPTIONAL { ?codeList ${labelProps} ?codeListLabel . ${filterLangs('?codeListLabel')} }
    OPTIONAL { ?codeList ${commentProps} ?codeListComment . ${filterLangs('?codeListComment')} }
    OPTIONAL { ?code1 ${labelProps} ?code1Label . ${filterLangs('?code1Label')} }
    OPTIONAL { ?code1 ${commentProps} ?code1Comment . ${filterLangs('?code1Comment')} }
    OPTIONAL {
      ?code2 a ?codeList .
      ?code1 ?p ?code2 .
    }
    OPTIONAL {
      ?ap rdfs:range ?codeList . 
      OPTIONAL { ?ap a ?apType . }
      OPTIONAL { ?ap ${labelProps} ?apLabel . ${filterLangs('?apLabel')} }
      OPTIONAL { ?ap ${commentProps} ?apComment . ${filterLangs('?apComment')} }
      OPTIONAL { ?ap rdfs:domain ?dt . }
    }
  }
`;
```

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

### Working code lists SPARQL endpoint available
- workbench: https://fcp.vse.cz/blazegraphpublic/#namespaces (choose the endpoint named `codelists`)
- SPARQL endpoint with unfiltered code lists: `https://fcp.vse.cz/blazegraphpublic/namespace/codelists/sparql`
- SPARQL endpoint with filtered code lists: `https://fcp.vse.cz/blazegraphpublic/namespace/codelists-distilled/sparql`

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

### Code lists overview data table for manual analysis + SPARQL queries to generate it
- https://github.com/nvbach91/iga-hybrid/tree/master/codelists/results

### Code lists graph schema + example
- https://drive.google.com/file/d/1VtlSmfxKMfY1XMMb05Zj6zgTyTWN7pbL

![image](https://user-images.githubusercontent.com/20724910/198905252-3b4a023b-d009-469d-9127-f0bbc36fe73d.png)


