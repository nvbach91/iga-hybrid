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
import Link from '@material-ui/core/Link';

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
    rows: Object.keys(window.prefixes),
  }
  handleInputChange = (name) => (e) => {
    this.setState({ 
      [name]: e.target.value, 
      rows: Object.keys(window.prefixes).filter((prefix) => {
        return prefix.toLowerCase().includes(e.target.value.trim().toLowerCase());
      }) 
    });
  }
  render = () => {
    const { classes } = this.props;
    return (
      <React.Fragment>
      <Typography align="left" variant="h5">
        Search for prefixes
      </Typography>
      <Typography align="left" variant="subtitle2">
        These prefixes come from <Link href="https://prefix.cc/context">prefix.cc</Link>
      </Typography>
        <Paper className={classes.paper}>
          <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
            <Toolbar>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <SearchIcon className={classes.block} color="inherit" />
                </Grid>
                <FormControl className={classes.formControl}>
                  <TextField value={this.state.searchValue} onChange={this.handleInputChange('searchValue')} />
                </FormControl>
              </Grid>
            </Toolbar>
          </AppBar>
          <Paper className={classes.root}>
            <PrefixesTable rows={this.state.rows}/>
          </Paper>
        </Paper>
      </React.Fragment>
    );
  }
}

PrefixesPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PrefixesPage);
