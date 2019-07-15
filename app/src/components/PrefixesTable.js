import React from 'react';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';
import { createIriLink } from '../utils';
import VirtualizedTable from './VirtualizedTable'

export default function PrefixesTable({ rows }) {
  const mRows = rows.map((prefix) => {
    const iri = window.prefixes[prefix];
    return { id: prefix, prefix: createIriLink(iri), iri: <Link href={iri} target="_blank" rel="noopener noreferrer">{iri}</Link> };
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
