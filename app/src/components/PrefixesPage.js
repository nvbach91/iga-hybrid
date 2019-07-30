import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import FormControl from '@material-ui/core/FormControl';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import PrefixesTable from './PrefixesTable';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { createLink, debounce } from '../utils';

const styles = theme => ({
  paper: {
    margin: 'auto',
    position: 'relative',
  },
  searchBar: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  },
  block: {
    display: 'block',
  },
  formControl: {
    flexGrow: 1
  },
});
class PrefixesPage extends React.Component {
  state = {
    searchValue: '',
    rows: Object.keys(window.cached.prefixes),
  }
  updateList = debounce(() => {
    this.setState({
      rows: Object.keys(window.cached.prefixes).filter((prefix) => {
        const v = this.state.searchValue.trim().toLowerCase();
        return (
          prefix.toLowerCase().includes(v) ||
          window.cached.prefixes[prefix].toLowerCase().includes(v)
        );
      })
    })
  }, 500)
  handleInputChange = (e) => {
    this.setState({ searchValue: e.target.value }, this.updateList);
  }
  render = () => {
    const { classes } = this.props;
    return (
      <>
      <Typography align="left" variant="h5">
        Search for prefixes
      </Typography>
      <Typography align="left" variant="subtitle2">
        All prefixes used in this application come from {createLink('https://prefix.cc/context')}
      </Typography>
        <Paper className={classes.paper}>
          <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
            <Toolbar>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <SearchIcon className={classes.block} color="inherit" />
                </Grid>
                <FormControl className={classes.formControl}>
                  <TextField value={this.state.searchValue} onChange={this.handleInputChange} />
                </FormControl>
              </Grid>
            </Toolbar>
          </AppBar>
          <Paper className={classes.root}>
            <PrefixesTable rows={this.state.rows}/>
          </Paper>
        </Paper>
      </>
    );
  }
}

PrefixesPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PrefixesPage);
