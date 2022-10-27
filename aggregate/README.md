# Aggregate data
In this folder, you can find aggregate data results

### Fetch aggregate data
- Run `$> node fetch-results.js` to fetch aggregated query result data. This will create a result folder for the current date.
- you can change the endpoint URL in the `./config.json` file

Sample result data:
```json
{
  "http://purl.org/ontology/bibo/": {
    "http://www.w3.org/2002/07/owl#Thing": {
      "instances": 14,
      "properties": 0,
      "skos": false
    },
    "http://purl.org/ontology/bibo/DocumentStatus": {
      "instances": 9,
      "properties": 1,
      "skos": false
    },
    "http://purl.org/ontology/bibo/ThesisDegree": {
      "instances": 3,
      "properties": 1,
      "skos": false
    },
    "http://xmlns.com/foaf/0.1/Person": {
      "instances": 2,
      "properties": 0,
      "skos": false
    }
  },
  "http://purl.org/ontology/cco/core#": {},
}
```
Flattened result data:
```json
{
  "http://www.w3.org/2004/02/skos/core#Concept": {
    "vocab": "http://contsem.unizar.es/def/sector-publico/pproc",
    "codes": {
      "instances": 15,
      "properties": 5
    }
  },
  "http://xmlns.com/foaf/0.1/Person": {
    "vocab": "http://purl.org/vocab/bio/0.1/",
    "codes": {
      "instances": 1,
      "properties": 11
    }
  },
  "http://www.w3.org/2004/02/skos/core#ConceptScheme": {
    "vocab": "http://contsem.unizar.es/def/sector-publico/pproc",
    "codes": {
      "instances": 3,
      "properties": 0
    }
  }
}
```

### Stats calculation
Run `$> node calculate.js --date=2022-10-27` to get statistics of the aggregate data
```
Total vocabs     818
Total vocabs with skos   16
Total vocabs with candidate code lists   251
Total vocabs without candidate code lists        567
Total vocabs with codes          251
Total vocabs without codes       567
Total vocabs with assignment properties          156
Total vocabs without assignment properties       662
Total candidate code lists: 1690
Total candidate code list members 21747
Total candidate code lists with at least one assignment property 782
Total candidate code lists with at least one assignment property 908
```

You will also get a CSV file to examine the aggregate data
![image](https://user-images.githubusercontent.com/20724910/198343682-6601fdaf-8585-4331-b62c-7e02d4ce8730.png)
