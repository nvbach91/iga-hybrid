import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Visibility from '@material-ui/icons/Visibility';
import { createIriLink } from '../utils';
import { withStyles } from '@material-ui/styles';

const styles = (theme) => ({
  head: {
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    fontWeight: 'bold',
  },
  fragmentButton: {
    padding: '0 16px'
  }
});

const FragmentsTable = ({ fragments, showInstances, showOnlyFullFragments, classes }) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell className={classes.head} align="left">Subject</TableCell>
          <TableCell className={classes.head} align="left">Predicate</TableCell>
          <TableCell className={classes.head} align="left">Object</TableCell>
          <TableCell className={classes.head} align="right" title="The number of instantiated triples">Instances</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(fragments).filter((key) => {
          if (showOnlyFullFragments) {
            const { s, p, o } = fragments[key];
            return s && p && o;
          }
          return true;
        }).map((key) => {
          const { s, p, o, i } = fragments[key];
          return (
            <TableRow key={key}>
              <TableCell align="left">{s ? createIriLink(s.value) : ''}</TableCell>
              <TableCell align="left">{p ? createIriLink(p.value) : ''}</TableCell>
              <TableCell align="left">{o ? createIriLink(o.value) : ''}</TableCell>
              <TableCell align="right">
                {
                  i === null ?
                    <CircularProgress size={20} /> :
                    <Button className={classes.fragmentButton} variant={i.length ? 'contained' : 'text'} onClick={showInstances(key)} color="primary" title={`Show ${i.length} instances` }>
                      {i.length}{i.length ? <span>&nbsp;</span> : ''}{i.length ? <Visibility /> : ''}
                    </Button>
                }
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default withStyles(styles)(FragmentsTable);
