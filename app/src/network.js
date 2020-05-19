import axios from 'axios';
import bluebird from 'bluebird';
import { getEndpointUrl, PREFIXES, getQueryVocabStats } from './sparql'
export const axiosConfig = {
  headers: {
    "accept": "application/sparql-results+json,*/*;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  }
};

export const fetchVocabs = (reload) => {
  if (window.cached.vocabs && !reload) {
    return bluebird.resolve(window.cached.vocabs);
  }
  const payload = `query=${PREFIXES}${getQueryVocabStats()}`;
  let res;
  return axios.post(getEndpointUrl(), payload, axiosConfig).then((resp) => {
    res = resp.data;
    // console.log(res.results.bindings.length);
    // remove duplicates
    res.results.bindings = res.results.bindings.filter((v, i, a) => a.findIndex(t => (t.vocabURI.value === v.vocabURI.value)) === i);
    // console.log(res.results.bindings.length);
    return axios.post(getEndpointUrl('https://fcp.vse.cz/blazegraph/namespace/biomed'), payload, axiosConfig);
  }).then((resp) => {
    res.results.bindings = resp.data.results.bindings.filter((v, i, a) => a.findIndex(t => (t.vocabURI.value === v.vocabURI.value)) === i).concat(res.results.bindings);
    window.cached.vocabs = res;
    localStorage.setItem('cached.vocabs', JSON.stringify(res));
    localStorage.setItem('cached.vocabs.date', new Date().toISOString());
    return res;
  });
};