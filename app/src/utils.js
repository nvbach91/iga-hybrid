import React from 'react';
import Link from '@material-ui/core/Link';

export const debounce = (fn, time) => {
  let timeout;
  return function () {
    const functionCall = () => fn.apply(this, arguments);
    clearTimeout(timeout);
    timeout = setTimeout(functionCall, time);
  }
};

export const shortenIri = (iri) => {
  const prefixes = Object.keys(window.cached.reversePrefixes);
  for (let i = 0; i < prefixes.length; i++) {
    let prefix = prefixes[i];
    if (iri.startsWith(prefix)) {
      if (iri.length === prefix.length) {
        return window.cached.reversePrefixes[prefix];
      }
      return `${window.cached.reversePrefixes[prefix]}:${iri.slice(prefix.length)}`;
    }
  }
  return iri;
};

export const createIriLink = (iri) => {
  if (!/^https?:\/\//.test(iri)) {
    return iri;
  }
  return <Link href={iri} target="_blank" rel="noopener noreferrer">{shortenIri(iri)}</Link>;
};

export const createLink = (iri) => {
  return <Link href={iri} target="_blank" rel="noopener noreferrer">{iri}</Link>;
};