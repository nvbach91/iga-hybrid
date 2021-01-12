# Analysis of instances
![image](https://user-images.githubusercontent.com/20724910/104304783-1eb25f80-54cc-11eb-8b24-2f365a6f29d3.png)


## Usage
- Provide configurations to the file `config.json`
```js
{
  "endpoint": "http://localhost:8080/blazegraph/namespace/kb/sparql",   // the path to the sparql endpoint
  "username": "",                                                       // basic authentication username
  "password": ""                                                        // basic authentication password
}
```
- You should setup and run a local server with a data dump for faster querying
  - LOV + Vocab Data: https://lov.linkeddata.es/lov.nq.gz
- Run `node app.js`
- The results will be in the folder `./results`
