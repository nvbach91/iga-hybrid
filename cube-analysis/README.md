# Analysis of instances
![image](https://user-images.githubusercontent.com/20724910/104304783-1eb25f80-54cc-11eb-8b24-2f365a6f29d3.png)

### Installation
- Node.js 18.12.0
```
$> npm install -g yarn
$> yarn
```

## Usage
- set config in `config.json`
```js
{
  "endpoint": "https://fcp.vse.cz/blazegraphpublic/namespace/lov20221023/sparql", // the sparql endpoint URL
  "username": "",                                                                 // basic authentication username if needed
  "password": ""                                                                  // basic authentication password if needed
}
```
- You can setup and run a local server with the LOV data dump to avoid unecessary traffic on the official LOV server. Download LOV + Vocab Data here: https://lov.linkeddata.es/lov.nq.gz
- Or you can use this SPARQL endpoint `https://fcp.vse.cz/blazegraphpublic/namespace/lov20221023/sparql` which has the LOV data from the date 2022 October 23rd
- Run `node app.js`
- The results will be in the folder `./results`
