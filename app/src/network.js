import axios from 'axios';
import { SPARQL_ENDPOINT_URL, PREFIXES, getQueryIris } from './sparql'
export const axiosConfig = {
  headers: { 
    "accept": "application/sparql-results+json,*/*;q=0.9", 
    "accept-language": "en-US,en;q=0.9", 
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8", 
  }
};

export const fetchIris = () => {
    const payload = `query=${PREFIXES}${getQueryIris()}`;
    return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig)
};