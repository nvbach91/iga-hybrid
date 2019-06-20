import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import FormControl from '@material-ui/core/FormControl';
import Select from 'react-select';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import axios from 'axios';
import { SPARQL_ENDPOINT_URL, PREFIXES, getQueryConnectedSchemas } from '../sparql';
import { axiosConfig, fetchIris } from '../network';
import { debounce } from '../utils';
import { CircularProgress } from '@material-ui/core';
const styles = theme => ({
  paper: {
    margin: 'auto',
  },
  searchBar: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  },
  searchInput: {
    fontSize: theme.typography.fontSize,
  },
  block: {
    display: 'block',
  },
  submitButton: {
    marginRight: theme.spacing(1),
    minWidth: '100px'
  },
  contentWrapper: {
    margin: '40px 16px',
  },
  formControl: {
    flexGrow: 1
  }
});
const selectStyles = {
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      textAlign: 'left',
      padding: '10px'
    };
  },
};
class Content extends React.Component {
  state = {
    fragments: [],
    iris: [],
    selectedOption: null,
    loading: true,
  }
  componentDidMount = () => {
    fetchIris().then((resp) => {
      const iris = resp.data.results.bindings.map((binding) => {
        return { 
          iri: binding.vocabURI.value,
          label: binding.vocabLabel ? binding.vocabLabel.value : '',
          nClass: binding.nClass.value,
          nInd: binding.nInd.value,
        }
      });
      this.setState({ iris, loading: false });
    });
  }
  handleIriSelectChange = (selectedOption) => {
    this.setState({ selectedOption }, () => {
      this.fetchConnectedSchemas();
    });
  }
  fetchConnectedSchemas = debounce(() => {
    this.setState({ loading: true });
    const payload = `query=${PREFIXES}${getQueryConnectedSchemas(this.state.selectedOption.value)}`;
    axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
      const fragments = resp.data.results.bindings.map((binding) => {
        const { s, sd, p, o, od } = binding;
        return { 
          s: s ? s : sd || sd || null,
          p,
          o: o ? o : o || od || null
        };
      });
      this.setState({ fragments, loading: false }, () => {
        //this.
      });
    });
  }, 500)
  createIriOptions = () => {
    return this.state.iris.map(({ iri, label, nClass, nInd }) => {
      return { value: iri, label: `${iri}${label ? ` - ${label}` : ''}, classes: ${nClass}, instances: ${nInd}`};
    })
  }
  render = () => {
    const { classes } = this.props;
    const options = this.createIriOptions();
    return (
      <Paper className={classes.paper}>
        <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
          <Toolbar>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <SearchIcon className={classes.block} color="inherit" />
              </Grid>
              <FormControl className={classes.formControl}>
                <Select
                  classes={classes}
                  styles={selectStyles}
                  inputId="react-select-input"
                  TextFieldProps={{ label: 'Ontology IRI', placeholder: 'Type to search for ontology' }}
                  options={options}
                  value={this.state.selectedOption}
                  onChange={this.handleIriSelectChange}
                />
              </FormControl>
              <Grid item>
                <Button className={classes.submitButton}>
                  {this.state.loading ? <CircularProgress size={20} /> : 'Analyze'}
                </Button>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        <div className={classes.contentWrapper}>
          <Typography color="textSecondary" align="center"></Typography>
        </div>
      </Paper>
    );
  }
}

Content.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Content);
