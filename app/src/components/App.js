import React from 'react';
import Paperbase from './Paperbase';
import '../css/App.css';
import '../css/VOWL.css';
import 'codemirror/lib/codemirror.css';
//import 'codemirror/theme/material.css';
import axios from 'axios';
require('codemirror/mode/sparql/sparql');

class App extends React.Component {
  componentWillMount = () => {
    window.records = {};
    axios.get('https://prefix.cc/context').then((resp) => {
      window.cached.prefixes = resp.data['@context'];
      // additional prefixes
      window.cached.prefixes['lm-voag'] = 'http://voag.linkedmodel.org/voag#';
      window.cached.prefixes['ce'] = 'http://www.ebusiness-unibw.org/ontologies/consumerelectronics/v1#';
      window.cached.prefixes['rcc'] = 'http://web.resource.org/cc/';
      window.cached.prefixes['co-bbc'] = 'http://www.bbc.co.uk/ontologies/bbc/';
      window.cached.prefixes['gleif-base'] = 'https://www.gleif.org/ontology/Base/';
      window.cached.prefixes['gleif-l1'] = 'https://www.gleif.org/ontology/L1/';
      window.cached.prefixes['gleif-l2'] = 'https://www.gleif.org/ontology/L2/';
      window.cached.prefixes['gleif-re'] = 'https://www.gleif.org/ontology/ReportingException/';
      window.cached.prefixes['gleif-gc'] = 'https://www.gleif.org/ontology/Geocoding/';
      window.cached.prefixes['cubes'] = 'http://purl.org/qb4olap/cubes#';
      window.cached.prefixes['squdt'] = 'http://qudt.org/schema/qudt/';
      window.cached.prefixes['dkdk'] = 'http://www.data-knowledge.org/dk/';
      window.cached.prefixes['kanzaki'] = 'http://www.kanzaki.com/ns/music#';
      window.cached.reversePrefixes = {};
      Object.keys(window.cached.prefixes).forEach((prefix) => {
        window.cached.reversePrefixes[window.cached.prefixes[prefix]] = prefix;
      });
    });
  }
  render = () => (
    <div className="App">
      <Paperbase />
    </div>
  );
}

export default App;
