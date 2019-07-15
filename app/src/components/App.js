import React from 'react';
import Paperbase from './Paperbase';
import '../css/App.css';
import axios from 'axios';

class App extends React.Component {
  componentWillMount = () => {
    axios.get('https://prefix.cc/context').then((resp) => {
      window.prefixes = resp.data['@context'];
      window.reversePrefixes = {};
      Object.keys(window.prefixes).forEach((prefix) => {
        window.reversePrefixes[window.prefixes[prefix]] = prefix;
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
