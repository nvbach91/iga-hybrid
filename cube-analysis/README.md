# Dimensional analysis of instances

<!-- ![image](https://user-images.githubusercontent.com/20724910/104304783-1eb25f80-54cc-11eb-8b24-2f365a6f29d3.png) -->

### Installation
- Node.js 18.12.0
```
$> npm install -g yarn
$> yarn
```

## Usage
- You can change the SPARQL endpoint URL in the `./config.json` file
- You should setup and run a local server with the LOV data dump to avoid unecessary traffic on the official LOV server. Download LOV + Vocab Data here: https://lov.linkeddata.es/lov.nq.gz
- Or you can use this SPARQL endpoint `https://fcp.vse.cz/blazegraphpublic/namespace/lov20221023/sparql` which has the LOV data from the date 2022 October 23rd
- Run `node app.js`, the script take some time to complete...
- The results will be in the folder `./results/${date}`

![image](https://user-images.githubusercontent.com/20724910/198827619-69396205-1a65-45db-ae08-fd1462bdf8df.png)
