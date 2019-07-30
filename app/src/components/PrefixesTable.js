import React from 'react';
import Paper from '@material-ui/core/Paper';
import { createIriLink, createLink } from '../utils';
import VirtualizedTable from './VirtualizedTable'

export default function PrefixesTable({ rows }) {
  const mRows = rows.map((prefix) => {
    const iri = window.cached.prefixes[prefix];
    if (window.cached.renderedPrefixes[prefix]) {
      return window.cached.renderedPrefixes[prefix];
    } else {
      const renderedPrefix = { id: prefix, prefix: createIriLink(iri), iri: createLink(iri) };
      window.cached.renderedPrefixes[prefix] = renderedPrefix;
      return renderedPrefix;
    }
  })
  return (
    <Paper style={{ height: 400, width: '100%' }}>
      <VirtualizedTable
        rowCount={mRows.length}
        rowGetter={({ index }) => mRows[index]}
        columns={[
          {
            width: 200,
            label: 'Prefix',
            dataKey: 'prefix',
          },
          {
            flexGrow: 1,
            width: 0,
            label: 'IRI',
            dataKey: 'iri',
          },
        ]}
      />
    </Paper>
  );
}
