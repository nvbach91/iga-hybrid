import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Visibility from '@material-ui/icons/Visibility';
import Palette from '@material-ui/icons/Palette';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import { SPARQL_ENDPOINT_URL, PREFIXES, getQueryCodeListInstances, getQueryClassInstanceCounts, getQueryCodeListStructure } from '../sparql';
import { axiosConfig } from '../network';
import { createIriLink, createLink } from '../utils';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import CodeListsTable from './CodeListsTable';
import CodeListInstancesTable from './CodeListInstancesTable';
import Typography from '@material-ui/core/Typography';
import TextareaAutosize from 'react-autosize-textarea';
import VocabSelector from './VocabSelector';
import { drawGraph, parseToVOWLSpec } from './VOWL';

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
class CodeListsPage extends React.Component {
  state = {
    codeLists: {},
    selectedVocabOption: null,
    loading: false,
    codeListInstances: null,
    codeList: null,
    sparqlPreview: false,
    codeListInstanceGraphNodes: null,
    codeListInstancesGraphLoading: false,
  }
  onVocabSelected = (selectedVocabOption) => {
    this.setState({ selectedVocabOption }, () => {
      this.fetchCodeLists();
    });
  }
  fetchCodeLists = () => {
    this.setState({ loading: true });
    const payload = `query=${PREFIXES}${getQueryClassInstanceCounts(this.state.selectedVocabOption.value)}`;
    return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
      const codeLists = {};
      resp.data.results.bindings.filter((binding) => binding.n.value > 0).forEach((binding) => {
        const { d, p, c, n } = binding;
        const uuid = uuidv4();
        const codeList = { d, p, c, n };
        codeList.i = 0;
        codeLists[uuid] = codeList;
      });
      const uniqueCodeLists = {};
      Object.keys(codeLists).forEach((key) => {
        uniqueCodeLists[codeLists[key].c.value] = codeLists[key].n.value;
      });
      window.records[this.state.selectedVocabOption.value] = uniqueCodeLists;
      this.setState({ codeLists, loading: false });
    });
  }
  showSparqlPreview = (query) => () => {
    this.setState({ sparqlPreview: query });
  }
  showInstances = (key) => () => {
    const { c } = this.state.codeLists[key];
    const payload = `query=${PREFIXES}${getQueryCodeListInstances(c.value, this.state.selectedVocabOption.value)}`;
    this.setState({ codeListInstancesLoading: true });
    return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
      this.setState({
        codeListInstancesLoading: false,
        codeListInstances: resp.data.results.bindings,
        codeList: c,
      });
    });
  }
  closeSparqlModal = () => {
    this.setState({ sparqlPreview: false });
  }
  closeInstancesModal = () => {
    this.setState({ codeListInstances: null, codeList: null });
  }
  closeGraphModal = () => {
    this.setState({ codeListInstanceGraphNodes: null });
  }
  handleLoadGraph = () => {
    const payload = `query=${PREFIXES}${getQueryCodeListStructure(this.state.codeList.value, this.state.selectedVocabOption.value)}`;
    return axios.post(SPARQL_ENDPOINT_URL, payload, axiosConfig).then((resp) => {
      const data = parseToVOWLSpec(resp.data.results.bindings);
      this.setState({ codeListInstancesGraphLoading: false, codeListInstanceGraphNodes: data }, () => {
        setTimeout(() => {
          drawGraph(data);
        }, 1000)
      });
    });
  };
  render = () => {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <div className={classes.controls}>
          <Typography align="left" variant="h5">
            Find code lists
          </Typography>
          <div>
            <Button color="primary" onClick={this.showSparqlPreview(getQueryClassInstanceCounts(this.state.selectedVocabOption ? this.state.selectedVocabOption.value : '__YOUR_SELECTED_VOCAB__').trim())}>View SPARQL&nbsp;<Visibility /></Button>
          </div>
        </div>
        <Typography align="left" variant="subtitle2">
          This tool will help you identify code lists embedded in a vocabulary. Please start by selecting an ontology below.
        </Typography>
        <Paper className={classes.paper}>
          <VocabSelector onVocabSelected={this.onVocabSelected} onReloadClick={this.fetchCodeLists} />
          <Paper className={classes.root}>
            <CodeListsTable
              codeLists={this.state.codeLists}
              showInstances={this.showInstances}
              vocabIsSelected={this.state.selectedVocabOption ? true : false}
            />
          </Paper>
        </Paper>
        <Dialog onClose={this.closeInstancesModal} open={this.state.codeListInstances || this.state.codeListInstancesLoading ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>Vocabulary: {this.state.selectedVocabOption && createIriLink(this.state.selectedVocabOption.value)}</span>
              {this.state.codeList && (
                <span>
                  <Button color="primary" onClick={this.handleLoadGraph}>Visualize&nbsp;<Palette /></Button>
                  <Button color="primary" onClick={this.showSparqlPreview(getQueryCodeListInstances(this.state.codeList.value, this.state.selectedVocabOption.value).trim())}>View SPARQL&nbsp;<Visibility /></Button>
                </span>
              )}
            </div>
            <div className={classes.dialogTitle}>
              <span>Code list: {this.state.codeList && createIriLink(this.state.codeList.value)}</span>
            </div>
          </DialogTitle>
          <CodeListInstancesTable loading={this.state.codeListInstancesLoading} codeListInstances={this.state.codeListInstances} codeList={this.state.codeList} />
        </Dialog>
        <Dialog onClose={this.closeGraphModal} open={this.state.codeListInstanceGraphNodes || this.state.codeListInstancesGraphLoading ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>Code list view (showing max 100 nodes)</span> 
              {this.state.codeList && createIriLink(this.state.codeList.value)}
            </div>
          </DialogTitle>
          <div className="ontology-graph">
            <div id="example">
              <div id="control">
                <div>
                  <div id="sliderOption" />
                </div>
                <div id="resetOption" />
              </div>
              <div id="graph" />
            </div>
          </div>
        </Dialog>
        <Dialog onClose={this.closeSparqlModal} open={this.state.sparqlPreview ? true : false} fullWidth={true} maxWidth="md">
          <DialogTitle>
            SPARQL query
            <Typography variant="body2">See also {createLink('https://github.com/nvbach91/iga-hybrid')}</Typography>
          </DialogTitle>
          <TextareaAutosize readOnly className={classes.codeBlock} defaultValue={this.state.sparqlPreview} />
        </Dialog>
      </React.Fragment>
    );
  }
}

CodeListsPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CodeListsPage);
