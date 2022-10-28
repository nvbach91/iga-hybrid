# Code List Analyzer
An UI to browse code lists using embedded SPARQL queries

## Development
- Node.js version 8.17.0
- installation: 
```
$> npm install -g yarn
$> yarn
```
- local development `$> yarn start`

## Deployment
DEV: https://nvbach91.github.io/iga-hybrid/ (https://github.com/nvbach91/iga-hybrid/tree/gh-pages)
```
$> yarn deploy
```

PROD: https://fcp.vse.cz/iga-hybrid
```
$> npm run build
$> sudo bash
$> rm -rf /var/www/fcp.vse.cz/iga-hybrid/*
$> mv build/* /var/www/fcp.vse.cz/iga-hybrid/
```
