import React from 'react';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Visibility from '@material-ui/icons/Visibility';
import Typography from '@material-ui/core/Typography';
import { createIriLink } from '../utils';
import { withStyles } from '@material-ui/styles';
import VirtualizedTable from './VirtualizedTable'

const tableHeadStyle = {
  backgroundColor: 'white',
  position: 'sticky',
  top: 0,
  fontWeight: 'bold',
};
const styles = (theme) => ({
  head: tableHeadStyle,
  headLast: {
    ...tableHeadStyle,
    width: 150,
  },
  fragmentButton: {
    padding: '4px 16px',
    minWidth: 96,
    justifyContent: 'flex-end',
  }
});

const CodeListsTable = ({ codeLists, showInstances, vocabIsSelected, classes, loading }) => {
  const mRows = codeLists ? Object.keys(codeLists).map((key, index) => {
    const { d, p, c, n } = codeLists[key];
    return { 
      id: key, 
      index: index + 1, 
      d: createIriLink(d ? d.value : ''), 
      p: createIriLink(p ? p.value : ''), 
      c: createIriLink(c ? c.value : ''), 
      n: n ? n.value : '', 
      i: n ? <Button className={classes.fragmentButton}  onClick={showInstances(key)} color="primary">{n.value}&nbsp;<Visibility /></Button> : 0
    };
  }) : [];
  return (
    
    <Paper style={{ height: 620, width: '100%' }}>
      {(!vocabIsSelected || Object.keys(codeLists).length || loading) &&<VirtualizedTable
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
            flexGrow: 1,
            width: 0,
            label: 'Domain',
            dataKey: 'd',
          },
          {
            flexGrow: 1,
            width: 0,
            label: 'Property',
            dataKey: 'p',
          },
          {
            flexGrow: 1,
            width: 0,
            label: 'Code list (Range)',
            dataKey: 'c',
          },
          {
            flexGrow: 1,
            width: 0,
            label: 'Members',
            dataKey: 'n',
          },
          {
            width: 150,
            label: 'View',
            dataKey: 'i',
          },
        ]}
      />}
      {vocabIsSelected && !Object.keys(codeLists).length && !loading && <Paper>
        <Typography variant="subtitle2">No code lists found in this ontology</Typography>
        <Typography variant="body2">Please select another ontology in the list</Typography>
      </Paper>}
    </Paper>
    
  );
}

export default withStyles(styles)(CodeListsTable);
