import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Visibility from '@material-ui/icons/Visibility';
import Close from '@material-ui/icons/Close';
import axios from 'axios';
import bluebird from 'bluebird';
import uuidv4 from 'uuid/v4';
import { getEndpointUrl, PREFIXES, getQuerySchemaFragments, getQueryFragmentInstancesCount, getQueryFragmentInstances } from '../sparql';
import { axiosConfig } from '../network';
import { createIriLink, createLink } from '../utils';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FragmentsTable from './FragmentsTable';
import FragmentInstancesTable from './FragmentInstancesTable';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import chunk from 'lodash/chunk';
import {UnControlled as CodeMirror} from 'react-codemirror2';
import VocabSelector from './VocabSelector';

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
  codeBlock: {
    padding: '10px',
    width: 'calc(100% - 24px)',
    margin: '10px auto',
    fontWeight: 'bold',
    backgroundColor: '#ccc',
    height: 'auto',
    border: 'none',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
  }
});
class ClassFragmentsPage extends React.Component {
  state = {
    fragments: {},
    selectedVocabOption: null,
    loading: false,
    fragmentInstances: null,
    classFragment: null,
    sparqlPreview: false,
    showOnlyFullFragments: localStorage.getItem('preferences.showOnlyFullFragments') === 'true',
  }
  onVocabSelected = (selectedVocabOption) => {
    this.setState({ selectedVocabOption }, () => {
      this.fetchClassFragments();
    });
  }
  handleInputChange = (name) => (e) => {
    this.setState({ [name]: e.target.checked });
    if (name === 'showOnlyFullFragments') {
      localStorage.setItem('preferences.showOnlyFullFragments', e.target.checked);
    }
  };
  fetchClassFragments = () => {
    this.setState({ loading: true });
    const payload = `query=${PREFIXES}${getQuerySchemaFragments(this.state.selectedVocabOption.value)}`;
    return axios.post(getEndpointUrl(), payload, axiosConfig).then((resp) => {
      const fragments = {};
      resp.data.results.bindings.forEach((binding) => {
        const { s, sd, p, o, od } = binding;
        const uuid = uuidv4();
        const fragment = {
          s: s ? s : sd || sd || null,
          p,
          o: o ? o : o || od || null,
        };
        fragment.i = fragment.s && fragment.o && fragment.p ? null : 0;
        fragments[uuid] = fragment;
      });
      this.setState({ fragments, loading: false }, () => {
        this.fetchFragmentInstances();
      });
    });
  }
  fetchFragmentInstances = () => {
    const { fragments } = this.state;
    const fragmentKeys = Object.keys(fragments).filter((key) => {
      const { s, p, o } = fragments[key];
      if (this.state.showOnlyFullFragments) {
        return s && p && o;
      }
      return true;
    });
    const fragmentKeyGroups = chunk(fragmentKeys, 10);
    bluebird.each(fragmentKeyGroups, (fkg) => {
      const counts = {};
      return bluebird.delay(500).then(() => {
        return bluebird.map(fkg, (key) => {
          const { s, p, o } = fragments[key];
          if (s && p && o) {
            const payload = `query=${PREFIXES}${getQueryFragmentInstancesCount(fragments[key])}`;
            return axios.post(getEndpointUrl(), payload, axiosConfig).then((resp) => {
              counts[key] = resp.data.results.bindings[0].n.value;
            });
          }
          return bluebird.delay(0);
        });
      }).then(() => {
        const newFragments = { ...fragments };
        Object.keys(counts).forEach((countKey) => {
          newFragments[countKey].i = counts[countKey];
        });
        this.setState({ fragments: newFragments });
      });
    });
  };
  showSparqlPreview = (query) => () => {
    this.setState({ sparqlPreview: query });
  }
  showInstances = (key) => () => {
    const { s, p, o } = this.state.fragments[key];
    const payload = `query=${PREFIXES}${getQueryFragmentInstances(this.state.fragments[key])}`;
    this.setState({ fragmentInstancesLoading: true });
    return axios.post(getEndpointUrl(), payload, axiosConfig).then((resp) => {
      this.setState({
        fragmentInstancesLoading: false,
        fragmentInstances: resp.data.results.bindings,
        classFragment: { s, p, o }
      });
    });
  }
  closeSparqlModal = () => {
    this.setState({ sparqlPreview: false });
  }
  closeInstancesModal = () => {
    this.setState({ fragmentInstances: null, classFragment: null });
  }
  render = () => {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.controls}>
          <Typography align="left" variant="h5">
            Find class fragments
          </Typography>
          <div>
            <FormControlLabel
              control={<Switch checked={this.state.showOnlyFullFragments} onChange={this.handleInputChange('showOnlyFullFragments')} value="showOnlyFullFragments" color="primary" />}
              label="Show only full fragments"
            />
            <Button color="primary" onClick={
              this.showSparqlPreview(
                getQuerySchemaFragments(
                  this.state.selectedVocabOption ?
                    this.state.selectedVocabOption.value :
                    '__YOUR_SELECTED_VOCAB__'
                ).trim()
              )
            }>View SPARQL&nbsp;<Visibility /></Button>
          </div>
        </div>
        <Typography align="left" variant="subtitle2">
          This tool will help you identify class fragments in a selected ontology and fetch their instances. Begin by selecting an ontology in the list below.
        </Typography>
        <Paper className={classes.paper}>
          <VocabSelector onVocabSelected={this.onVocabSelected} onReloadClick={this.fetchClassFragments} />
          <Paper className={classes.root}>
            <FragmentsTable
              fragments={this.state.fragments}
              showInstances={this.showInstances}
              showOnlyFullFragments={this.state.showOnlyFullFragments}
              vocabIsSelected={this.state.selectedVocabOption ? true : false}
            />
          </Paper>
        </Paper>
        <Dialog onClose={this.closeInstancesModal} open={this.state.fragmentInstances || this.state.fragmentInstancesLoading ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>Class fragment instances in {this.state.selectedVocabOption && createIriLink(this.state.selectedVocabOption.value)}</span>
              {this.state.classFragment && (
                <span>
                  <Button color="primary" onClick={
                    this.showSparqlPreview(
                      getQueryFragmentInstances(this.state.classFragment).trim()
                    )
                  }>View SPARQL&nbsp;<Visibility /></Button>
                  <Button color="primary" onClick={this.closeInstancesModal}><Close /></Button>
                </span>
              )}
            </div>
          </DialogTitle>
          <FragmentInstancesTable fragmentInstancesLoading={this.state.fragmentInstancesLoading} fragmentInstances={this.state.fragmentInstances} classFragment={this.state.classFragment} />
        </Dialog>
        <Dialog onClose={this.closeSparqlModal} open={this.state.sparqlPreview ? true : false} fullWidth={true} maxWidth="md">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>SPARQL query preview</span>
              <Button color="primary" onClick={this.closeSparqlModal}><Close /></Button>
            </div>
            <Typography variant="body2">See also {createLink('https://github.com/nvbach91/iga-hybrid')}</Typography>
          </DialogTitle>
          <div className="code-mirror-container">
            <CodeMirror value={this.state.sparqlPreview} options={{
              mode: 'sparql',
              //theme: 'material',
              lineNumbers: true,
              readOnly: true,
            }}/>
          </div>
        </Dialog>
      </>
    );
  }
}

ClassFragmentsPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ClassFragmentsPage);
