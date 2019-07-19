import React from 'react';
import Paperbase from './Paperbase';
import '../css/App.css';
import '../css/VOWL.css';
import axios from 'axios';

class App extends React.Component {
  componentWillMount = () => {
    axios.get('https://prefix.cc/context').then((resp) => {
      window.cached.prefixes = resp.data['@context'];
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
