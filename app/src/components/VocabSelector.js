import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import Select from 'react-select';
import { withStyles } from '@material-ui/core/styles';
import { fetchVocabs } from '../network';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import SearchIcon from '@material-ui/icons/Search';
import Refresh from '@material-ui/icons/Refresh';
import AppBar from '@material-ui/core/AppBar';
import { arrayMove } from '../utils';

const styles = theme => ({
  formControl: {
    flexGrow: 1
  },
  submitButton: {
    marginRight: theme.spacing(1),
    minWidth: 140,
  },
  submitButtonContent: {
    display: 'flex',
    alignItems: 'center',
  },
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
class VocabSelector extends React.Component {
  state = {
    selectOptions: [],
    selectedOption: null,
    loading: true,
  }
  componentWillMount = () => {
    fetchVocabs().then((resp) => {
      const iris = []; resp.data.results.bindings.forEach((binding) => {
        iris.push({
          iri: binding.vocabURI.value,
          label: binding.vocabLabel ? binding.vocabLabel.value : '',
          nClass: binding.nClass.value,
          nInd: binding.nInd.value,
        });
      });
      iris.unshift({
        iri: 'http://dbpedia.org',
        label: 'DBpedia',
        nClass: 760,
        nInd: 18447062,
      });
      // move vocabs that have code lists up the list
      arrayMove(iris, 7, 0);
      arrayMove(iris, 8, 1);
      arrayMove(iris, 9, 2);
      arrayMove(iris, 10, 3);
      this.setState({
        loading: false,
        selectOptions: iris.map(({ iri, label, nClass, nInd }) => {
          return { value: iri, label: `${iri}${label ? ` - ${label}` : ''}, classes: ${nClass}, instances: ${nInd}` };
        })
      });
    });
  }
  handleSelectChange = (selectedOption) => {
    this.setState({ selectedOption })
    this.props.onVocabSelected(selectedOption);
  }
  render = () => {
    const { classes } = this.props;
    return (
      <AppBar className={classes.searchBar} position="static" color="default" elevation={0}>
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <SearchIcon className={classes.block} color="inherit" />
            </Grid>

            <FormControl className={this.props.classes.formControl}>
              <Select
                styles={selectStyles}
                TextFieldProps={{ label: 'Ontology IRI', placeholder: 'Type to search for ontology' }}
                options={this.state.selectOptions}
                onChange={this.handleSelectChange}
              />
            </FormControl>
            <Grid item>
              <div className={classes.submitButton}>
                <Button color="primary" onClick={this.props.onReloadClick}>
                  <div className={classes.submitButtonContent}>
                    {this.state.loading || this.props.loading ? <CircularProgress size={20} /> : <Refresh style={{ fontSize: 24 }} />}&nbsp;Reload
                  </div>
                </Button>
              </div>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    )
  }
}

export default withStyles(styles)(VocabSelector);
