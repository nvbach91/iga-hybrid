import React from 'react';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { createIriLink } from '../utils';
import VirtualizedTable from './VirtualizedTable'
import { CircularProgress } from '@material-ui/core';

const styles = (theme) => ({
  head1: {
    backgroundColor: 'white',
    position: 'sticky',
    top: 0
  },
  head2: {
    backgroundColor: '#004b6e',
    color: 'white',
    position: 'sticky',
    top: 40,
    fontWeight: 'bold',
  }
});
const CodeListInstancesTable = ({ loading, codeListInstances, codeList, classes }) => {
  const mRows = codeListInstances ? codeListInstances.map((cli, index) => {
    const { i, sc, scs } = cli;
    return {
      id: index,
      index: index + 1,
      i: createIriLink(i.value),
      skosConcept: createIriLink(sc ? sc.value : 'Not a skos:Concept'),
      skosConceptScheme: createIriLink(scs ? scs.value : 'None')
    };
  }) : [];
  return (
    <Paper style={{ height: 620, width: '100%' }}>
      {loading ?
        <div style={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={40} /></div> :
        <VirtualizedTable
          rowCount={mRows.length}
          rowGetter={({ index }) => mRows[index]}
          columns={[
            {
              width: 100,
              label: `(${mRows.length}) #`,
              dataKey: 'index',
              numeric: true,
              align: 'right',
            },
            {
              flexGrow: 2,
              width: 0,
              label: 'Instance',
              dataKey: 'i',
            },
            {
              flexGrow: 1,
              width: 0,
              label: 'skos:Concept',
              dataKey: 'skosConcept',
            },
            {
              flexGrow: 2,
              width: 0,
              label: 'skos:inScheme',
              dataKey: 'skosConceptScheme',
            },
          ]}
        />
      }
    </Paper>
  );
}

export default withStyles(styles)(CodeListInstancesTable);
