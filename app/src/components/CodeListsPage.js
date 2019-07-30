import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Visibility from '@material-ui/icons/Visibility';
import Close from '@material-ui/icons/Close';
import Palette from '@material-ui/icons/Palette';
import CloudDownload from '@material-ui/icons/CloudDownload';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import { getEndpointUrl, PREFIXES } from '../sparql';
import { getQueryCodeListInstances, getQueryClassInstanceCounts, getQueryCodeListStructure } from '../sparql';
import { getDBpediaQueryBroadestConcepts, getDBpediaQueryCodeListMembers, getDBpediaQueryCodeListStructure } from '../sparql';
import { getQueryCodeListConstruct, getDBpediaQueryCodeListConstruct } from '../sparql';
import { axiosConfig } from '../network';
import { createIriLink, createLink, downloadFile, shortenIri } from '../utils';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import CodeListsTable from './CodeListsTable';
import CodeListInstancesTable from './CodeListInstancesTable';
import Typography from '@material-ui/core/Typography';
import VocabSelector from './VocabSelector';
import { drawGraph, parseToVOWLSpec } from './VOWL';
import { CircularProgress } from '@material-ui/core';
import {UnControlled as CodeMirror} from 'react-codemirror2';

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
    backgroundColor: '#ddd',
    height: 'auto',
    border: 'none',
    overflow: 'auto !important',
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
    const { selectedVocabOption } = this.state;
    if (!selectedVocabOption) { return false; }
    this.setState({ loading: true });
    let query = getQueryClassInstanceCounts(selectedVocabOption ? selectedVocabOption.value : '__YOUR_SELECTED_VOCAB__').trim();
    let prefixes = PREFIXES;
    if (selectedVocabOption.value === 'http://dbpedia.org') {
      query = encodeURIComponent(getDBpediaQueryBroadestConcepts());
      prefixes = '';
    }
    const payload = `query=${prefixes}${query}`;
    return axios.post(getEndpointUrl(selectedVocabOption.value), payload, axiosConfig).then((resp) => {
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
        if (uniqueCodeLists[codeLists[key].c.value] && codeLists[key].p) {
          uniqueCodeLists[codeLists[key].c.value].properties++;
        } else {
          uniqueCodeLists[codeLists[key].c.value] = { instances: codeLists[key].n.value, properties: codeLists[key].p ? 1: 0 };
        }
      });
      window.cached.records[selectedVocabOption.value] = uniqueCodeLists;
      this.setState({ codeLists, loading: false });
    });
  }
  showSparqlPreview = (queries) => () => {
    this.setState({ sparqlPreview: queries });
  }
  showInstances = (key) => () => {
    const { selectedVocabOption, codeLists } = this.state;
    const { c } = codeLists[key];
    let query = getQueryCodeListInstances(c.value, selectedVocabOption.value);
    let prefixes = PREFIXES;
    if (selectedVocabOption.value === 'http://dbpedia.org') {
      prefixes = '';
      query = encodeURIComponent(getDBpediaQueryCodeListMembers(c.value));
    }
    const payload = `query=${prefixes}${query}`;
    this.setState({ codeListInstancesLoading: true });
    return axios.post(getEndpointUrl(selectedVocabOption.value), payload, axiosConfig).then((resp) => {
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
  handleDownloadCodeList = () => {
    this.setState({ downloading: true });
    const { selectedVocabOption, codeList } = this.state;
    let fromVocab = selectedVocabOption.value;
    let query = getQueryCodeListConstruct(codeList.value, fromVocab);
    let prefixes = PREFIXES;
    let ac = JSON.parse(JSON.stringify(axiosConfig));
    ac.headers.accept = 'application/x-turtle,*/*;q=0.9';
    if (selectedVocabOption.value === 'http://dbpedia.org') {
      fromVocab = '';
      prefixes = '';
      query = encodeURIComponent(getDBpediaQueryCodeListConstruct(codeList.value));
    }
    const payload = `query=${prefixes}${query}`;
    axios.post(getEndpointUrl(selectedVocabOption.value), payload, ac).then((resp) => {
      let fileName = shortenIri(codeList.value);
      if (fileName.startsWith('http') && fileName.includes('/')) {
        fileName = fileName.split('/').slice(-1);
      } else {
        fileName = fileName.replace(/[:/]/g, '-');
      }
      downloadFile(`${fileName}.ttl`, resp.data, 'turtle');
      this.setState({ downloading: false });
    });
  }
  handleLoadGraph = () => {
    const { selectedVocabOption, codeList } = this.state;
    let fromVocab = selectedVocabOption.value;
    let query = getQueryCodeListStructure(codeList.value, fromVocab);
    let prefixes = PREFIXES;
    if (selectedVocabOption.value === 'http://dbpedia.org') {
      fromVocab = '';
      prefixes = '';
      query = encodeURIComponent(getDBpediaQueryCodeListStructure(codeList.value));
    }
    this.setState({ codeListInstancesGraphLoading: true });
    const payload = `query=${prefixes}${query}`;
    return axios.post(getEndpointUrl(selectedVocabOption.value), payload, axiosConfig).then((resp) => {
      const data = parseToVOWLSpec(resp.data.results.bindings);
      this.setState({ codeListInstancesGraphLoading: false, codeListInstanceGraphNodes: data }, () => {
        setTimeout(() => {
          drawGraph(data);
        }, 1000)
      });
    });
  };
  render = () => {
    const { selectedVocabOption, loading, codeLists, codeList, codeListInstances, codeListInstancesLoading, codeListInstancesGraphLoading, codeListInstanceGraphNodes, sparqlPreview } = this.state;
    const { classes } = this.props;
    return (
      <>
        <div className={classes.controls}>
          <Typography align="left" variant="h5">
            Find code lists
          </Typography>
          <div>
            <Button color="primary" onClick={this.showSparqlPreview(
              selectedVocabOption ? 
                (selectedVocabOption.value === 'http://dbpedia.org' ? 
                  [{ name: 'Query for listing code lists', query: getDBpediaQueryBroadestConcepts().trim()}] :
                  [{ name: 'Query for listing code lists', query: getQueryClassInstanceCounts(selectedVocabOption.value || '__YOUR_SELECTED_VOCAB__').trim()}]) : ''
            )}>View SPARQL&nbsp;<Visibility /></Button>
          </div>
        </div>
        <Typography align="left" variant="subtitle2">
          This tool will help you identify code lists embedded in a knowledge graph or vocabulary. Please start by selecting an item below.
        </Typography>
        <Paper className={classes.paper}>
          <VocabSelector onVocabSelected={this.onVocabSelected} onReloadClick={this.fetchCodeLists} loading={loading}/>
          <Paper className={classes.root}>
            <CodeListsTable
              loading={loading}
              codeLists={codeLists}
              showInstances={this.showInstances}
              vocabIsSelected={selectedVocabOption ? true : false}
            />
          </Paper>
        </Paper>
        <Dialog onClose={this.closeInstancesModal} open={codeListInstances || codeListInstancesLoading ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>Vocabulary: {selectedVocabOption && createIriLink(selectedVocabOption.value)}</span>
              {codeList && (
                <span style={{minWidth: 412}}>
                  <Button color="primary" disabled={this.state.downloading} onClick={this.handleDownloadCodeList}>
                    Download RDF&nbsp;{this.state.downloading ? <CircularProgress size={20}/> : <CloudDownload />}
                  </Button>
                  <Button color="primary" onClick={this.handleLoadGraph}>Visualize&nbsp;<Palette /></Button>
                  <Button color="primary" onClick={
                    this.showSparqlPreview([
                      { name: 'Query for listing members', query: getQueryCodeListInstances(codeList.value, selectedVocabOption.value).trim() },
                      { name: 'Query for visualization', query: getQueryCodeListStructure(codeList.value, selectedVocabOption.value).trim() },
                      { name: 'Query for download', query: getQueryCodeListConstruct(codeList.value, selectedVocabOption.value).trim() }
                    ])
                  }>View SPARQL&nbsp;<Visibility /></Button>
                  <Button color="primary" onClick={this.closeInstancesModal}><Close /></Button>
                </span>
              )}
            </div>
            <div className={classes.dialogTitle}>
              <span>Code list: {codeList && createIriLink(codeList.value)}</span>
            </div>
          </DialogTitle>
          <CodeListInstancesTable loading={codeListInstancesLoading} codeListInstances={codeListInstances} codeList={codeList} />
        </Dialog>
        <Dialog onClose={this.closeGraphModal} open={codeListInstanceGraphNodes || codeListInstancesGraphLoading ? true : false} fullWidth={true} maxWidth="xl">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <div>Code list view (showing max 100 nodes)</div> 
              {codeList && (
                <div>
                  {createIriLink(codeList.value)}
                  <Button color="primary" onClick={this.closeGraphModal}><Close /></Button>
                </div>
              )}
            </div>
          </DialogTitle>
          {codeListInstancesGraphLoading && <div style={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={40} /></div>}
          <div className="ontology-graph">
            <div id="example">
              <div id="control">
                <div className="slider-container">
                  {!codeListInstancesGraphLoading && <label>Distance</label>}
                  <div id="sliderOption" />
                </div>
                <div id="resetOption" />
              </div>
              <div id="graph" />
            </div>
          </div>
        </Dialog>
        <Dialog onClose={this.closeSparqlModal} open={sparqlPreview ? true : false} fullWidth={true} maxWidth="md">
          <DialogTitle>
            <div className={classes.dialogTitle}>
              <span>SPARQL query preview</span>
              <Button color="primary" onClick={this.closeSparqlModal}><Close /></Button>
            </div>
            <Typography variant="body2">See also {createLink('https://github.com/nvbach91/iga-hybrid')}</Typography>
            <Typography variant="body2">Endpoint {createLink(selectedVocabOption ? getEndpointUrl(selectedVocabOption.value) : '')}</Typography>
          </DialogTitle>
          {sparqlPreview ? sparqlPreview.map((preview, index) => {
            return (
              <div className="code-mirror-container" key={index}>
                <Typography variant="subtitle2" style={{ textIndent: 34, marginTop: 20 }}>{preview.name}</Typography>
                <CodeMirror value={preview.query} options={{
                  mode: 'sparql',
                  //theme: 'material',
                  lineNumbers: true,
                  readOnly: true,
                }}/>
              </div>
            );
          }) : <div />}
        </Dialog>
      </>
    );
  }
}

CodeListsPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CodeListsPage);
