import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import { createIriLink } from '../utils';

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
const FragmentInstancesTable = ({ fragmentInstances, classFragment, classes }) => {
  return (
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
  );
}

export default withStyles(styles)(FragmentInstancesTable);
