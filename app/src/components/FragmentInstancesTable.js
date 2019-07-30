import React from 'react';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableHead from '@material-ui/core/TableHead';
// import TableRow from '@material-ui/core/TableRow';
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
const FragmentInstancesTable = ({ fragmentInstancesLoading, fragmentInstances, classFragment, classes }) => {
  const mRows = fragmentInstances ? fragmentInstances.map((fi, index) => {
    const { s, p, o } = fi;
    return { id: index, index: index + 1, s: createIriLink(s.value), p: createIriLink(p.value), o: createIriLink(o.value) };
  }) : [];
  return (
    <Paper style={{ height: 620, width: '100%' }}>
      {fragmentInstancesLoading ?
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
              flexGrow: 1,
              width: 0,
              label: <span>Subject class&nbsp;({createIriLink(classFragment ? classFragment.s.value : '')})</span>,
              dataKey: 's',
            },
            {
              flexGrow: 1,
              width: 0,
              label: <span>Predicate&nbsp;({createIriLink(classFragment ? classFragment.p.value : '')})</span>,
              dataKey: 'p',
            },
            {
              flexGrow: 1,
              width: 0,
              label: <span>Object class&nbsp;({createIriLink(classFragment ? classFragment.o.value : '')})</span>,
              dataKey: 'o',
            },
          ]}
        />
      }
    </Paper>
  );
  /*return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell align="right" className={classes.head1} style={{ width: 150 }}>#</TableCell>
          <TableCell className={classes.head1}>Subject</TableCell>
          <TableCell className={classes.head1}>Predicate</TableCell>
          <TableCell className={classes.head1}>Object</TableCell>
        </TableRow>
        <TableRow>
          <TableCell align="right" className={classes.head2}>Class fragment</TableCell>
          <TableCell className={classes.head2}>{classFragment && classFragment.s ? createIriLink(classFragment.s.value) : ''}</TableCell>
          <TableCell className={classes.head2}>{classFragment && classFragment.p ? createIriLink(classFragment.p.value) : ''}</TableCell>
          <TableCell className={classes.head2}>{classFragment && classFragment.o ? createIriLink(classFragment.o.value) : ''}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {fragmentInstances && fragmentInstances.map((fi, index) => {
          const { s, p, o } = fi;
          return (
            <TableRow key={index}>
              <TableCell align="right">{index + 1}</TableCell>
              <TableCell>{createIriLink(s.value)}</TableCell>
              <TableCell>{createIriLink(p.value)}</TableCell>
              <TableCell>{createIriLink(o.value)}</TableCell>
            </TableRow>
          );
        })}
        {fragmentInstances && !fragmentInstances.length && (
          <TableRow>
            <TableCell></TableCell>
            <TableCell align="left">No instances available</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );*/
}

export default withStyles(styles)(FragmentInstancesTable);
