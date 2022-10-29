# Dimensional analysis of instances
![image](https://user-images.githubusercontent.com/20724910/198846602-d0ef459d-a432-4880-9c79-11190e12f9e6.png)

<!-- ![image](https://user-images.githubusercontent.com/20724910/104304783-1eb25f80-54cc-11eb-8b24-2f365a6f29d3.png) -->

### Installation
- Node.js 18.12.0
```
$> npm install -g yarn
$> yarn
```

## Usage
- you can change the SPARQL endpoint URL in the `./config.json` file
- you should set up a local SPARQL endpoint with the LOV data dump to avoid unecessary traffic on the official LOV server.
  - download LOV + Vocab Data here: https://lov.linkeddata.es/lov.nq.gz
- or you can use this SPARQL endpoint `https://fcp.vse.cz/blazegraphpublic/namespace/lov20221023/sparql` 
  - it has the LOV data dump of October 23rd 2022
- Run `node app.js`, the script will take some time to complete...
- The result data will be in the folder `./results/${date}`

![image](https://user-images.githubusercontent.com/20724910/198827619-69396205-1a65-45db-ae08-fd1462bdf8df.png)

- Then you can run `node calculate.js --date=2022-10-23` to calculate the cube values

![image](https://user-images.githubusercontent.com/20724910/198846583-5d4da2b0-de69-49d9-a71c-82a994d8f927.png)
