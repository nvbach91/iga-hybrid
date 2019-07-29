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
  const candidatePrefixes = [];
  for (let i = 0; i < prefixes.length; i++) {
    let prefix = prefixes[i];
    if (iri.startsWith(prefix)) {
      candidatePrefixes.push(prefix);
    }
  }
  for (let i = 0; i < candidatePrefixes.length; i++) {
    let prefix = candidatePrefixes[i];
    if (iri.length === prefix.length) {
      return window.cached.reversePrefixes[prefix];
    }
  }
  for (let i = 0; i < candidatePrefixes.length; i++) {
    let prefix = candidatePrefixes[i];
    if (iri.startsWith(prefix)) {
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

export const downloadFile = (filename, text, type) => {
  var element = document.createElement('a');
  element.setAttribute('href', `data:text/${type || 'plain'};charset=utf-8,` + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
