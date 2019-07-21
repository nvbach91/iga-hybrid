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

export const fetchVocabs = () => {
  if (window.cached.vocabs) {
    return bluebird.resolve(window.cached.vocabs);
  }
  const payload = `query=${PREFIXES}${getQueryVocabStats()}`;
  return axios.post(getEndpointUrl(), payload, axiosConfig).then((resp) => {
    window.cached.vocabs = resp;
    return resp;
  });
};