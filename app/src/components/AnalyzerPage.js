import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import FormControl from '@material-ui/core/FormControl';
import Select from 'react-select';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import Visibility from '@material-ui/icons/Visibility';
import axios from 'axios';
import bluebird from 'bluebird';
import uuidv4 from 'uuid/v4';
import { SPARQL_ENDPOINT_URL, PREFIXES, getQueryConnectedSchemas, getQueryFragmentInstances } from '../sparql';
import { axiosConfig, fetchIris } from '../network';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FragmentsTable from './FragmentsTable';
import FragmentInstancesTable from './FragmentInstancesTable';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

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
  submitButton: {
    marginRight: theme.spacing(1),
    minWidth: '100px'
  },
  formControl: {
    flexGrow: 1
  },
  codeBlock: {
    padding: 10
  },
  filler: {
    height: 200,
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
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
class AnalyzerPage extends React.Component {
  state = {
    fragments: {},
    iris: [],
    selectedOption: null,
    loading: true,
    fragmentInstances: null,
    classFragment: null,
    sparqlPreview: false,
    showOnlyFullFragments: localStorage.getItem('preferences.showOnlyFullFragments') === 'true',
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
  handleInputChange = (name) => (e) => {
    this.setState({ [name]: e.target.checked });
    if (name === 'showOnlyFullFragments') {
      localStorage.setItem('preferences.showOnlyFullFragments', e.target.checked);
    }
  };
  fetchConnectedSchemas = () => {
    this.setState({ loading: true });
    const payload = `query=${PREFIXES}${getQueryConnectedSchemas(this.state.selectedOption.value)}`;
    return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
      const fragments = {};
      resp.data.results.bindings.forEach((binding) => {
        const { s, sd, p, o, od } = binding;
        const uuid = uuidv4();
        const fragment = {
          s: s ? s : sd || sd || null,
          p,
          o: o ? o : o || od || null,
        };
        fragment.i = fragment.s && fragment.o && fragment.p ? null : [];
        fragments[uuid] = fragment;
      });
      this.setState({ fragments, loading: false }, () => {
        this.fetchFragmentInstances();
      });
    });
  }
  fetchFragmentInstances = () => {
    const { fragments } = this.state;
    bluebird.map(Object.keys(fragments), (key) => {
      const { s, p, o } = fragments[key];
      if (s && p && o) {
        const payload = `query=${PREFIXES}${getQueryFragmentInstances(s, p, o)}`;
        return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
          const newFragments = { ...fragments };
          newFragments[key].i = resp.data.results.bindings;
          this.setState({ fragments: newFragments });
        });
      }
      return bluebird.delay(0);
    });
  };
  createIriOptions = () => {
    return this.state.iris.map(({ iri, label, nClass, nInd }) => {
      return { value: iri, label: `${iri}${label ? ` - ${label}` : ''}, classes: ${nClass}, instances: ${nInd}` };
    })
  }
  showSparqlPreview = () => {
    this.setState({ sparqlPreview: true });
  }
  showInstances = (key) => () => {
    const { i, s, p, o } = this.state.fragments[key];
    this.setState({ fragmentInstances: i,  classFragment: { s, p, o } });
  }
  closeModal = () => {
    this.setState({ fragmentInstances: null, classFragment: null, sparqlPreview: false });
  }
  render = () => {
    const { classes } = this.props;
    const options = this.createIriOptions();
    return (
      <React.Fragment>
        <div className={classes.controls}>
          <Typography align="left" variant="h5">
            Find class fragments 
          </Typography>
          <div>
            <FormControlLabel
              control={ <Switch checked={this.state.showOnlyFullFragments} onChange={this.handleInputChange('showOnlyFullFragments')} value="showOnlyFullFragments" color="primary" />}
              label="Show only full fragments"
            />
            <Button color="primary" onClick={this.showSparqlPreview}>View SPARQL&nbsp;<Visibility /></Button>
          </div>
        </div>
        <Typography align="left" variant="subtitle2">
          This tool will help you identify class fragments in a selected ontology and fetch their instances
        </Typography>
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
                  <Button variant="contained" className={classes.submitButton}>
                    {this.state.loading ? <CircularProgress size={20} /> : 'Analyze'}
                  </Button>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
          <Paper className={classes.root}>
            <FragmentsTable fragments={this.state.fragments} showInstances={this.showInstances} showOnlyFullFragments={this.state.showOnlyFullFragments}/>
          </Paper>
        </Paper>
        <div className={classes.filler}></div>
        <Dialog onClose={this.closeModal} open={this.state.fragmentInstances ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>Class fragment instances</DialogTitle>
          <FragmentInstancesTable fragmentInstances={this.state.fragmentInstances} classFragment={this.state.classFragment}/>
        </Dialog>
        <Dialog onClose={this.closeModal} open={this.state.sparqlPreview ? true : false} fullWidth={true} maxWidth="md">
          <DialogTitle>SPARQL query</DialogTitle>
          <pre className={classes.codeBlock}>{getQueryConnectedSchemas('__YOUR_SELECTED_VOCAB__').trim()}</pre>
        </Dialog>
      </React.Fragment>
    );
  }
}

AnalyzerPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(AnalyzerPage);
