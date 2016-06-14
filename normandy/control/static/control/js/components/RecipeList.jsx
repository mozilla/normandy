import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { Table, Thead, Th, Tr, Td, applyFilter } from 'reactable'
import classNames from 'classnames'
import moment from 'moment'
import ControlActions from '../actions/ControlActions.js'

const BooleanIcon = (props) => {
  switch(props.value) {
    case true: return <i className="fa fa-lg fa-check green">&nbsp;</i>;
    case false: return <i className="fa fa-lg fa-times red">&nbsp;</i>;
  }
}

const SwitchFilter = (props) => {
  const { options, selectedFilter, updateFilter } = props;
  return (
    <div className="switch">
      <div className={classNames('switch-selection', `position-${options.indexOf(selectedFilter)}`)}>&nbsp;</div>
      { options.map(option =>
        <span key={option}
          className={classNames({ 'active': (option === selectedFilter) })}
          onClick={() => updateFilter(option)}>{option}
        </span>
      )}
    </div>
  )
}

class RecipeList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      searchQuery: '',
      filterStatus: 'All'
    }
  }

  componentWillMount() {
    const { dispatch } = this.props
    dispatch(ControlActions.makeApiRequest('fetchAllRecipes', {}));
    dispatch(ControlActions.setSelectedRecipe(null));
  }

  viewRecipe(recipe) {
    const { dispatch } = this.props;
    dispatch(ControlActions.setSelectedRecipe(recipe.id));
    dispatch(push(`/control/recipe/${recipe.id}/`));
  }

  updateSearch(event) {
    this.setState({
      searchText: event.target.value,
      searchQuery: `${event.target.value}:${this.state.filterStatus}`
    });
  }

  updateFilter(filterStatus) {
    let searchQuery = this.state.searchText;
    if (filterStatus !== 'All') {
      searchQuery = `${this.state.searchText}:${filterStatus}`;
    }

    this.setState({
      searchQuery,
      filterStatus
    })
  }

  parseFilter(contents, filter) {
    let enabledStatusMatches = true;

    if (this.state.filterStatus !== 'All') {
      enabledStatusMatches = (contents.split(':')[1] === this.state.filterStatus);
    }

    return enabledStatusMatches && contents.toLowerCase().indexOf(this.state.searchText.toLowerCase()) > -1;
  }

  formatFilterValue(recipe, property) {
    let status = (recipe.enabled === true ? 'Enabled' : 'Disabled');
    return `${recipe[property]}:${status}`;
  }

  render() {
    const { dispatch, recipes } = this.props;

    return (
      <div>
        <div id="secondary-header" className="fluid-8">
          <div className="fluid-2">
            <div className="search input-with-icon">
              <input type="text" placeholder="Search" value={this.state.searchText} onChange={::this.updateSearch} />
            </div>
          </div>
          <div id="filters-container" className="fluid-6">
            <h4>Filter By:</h4>
            <SwitchFilter options={['All', 'Enabled', 'Disabled']} selectedFilter={this.state.filterStatus} updateFilter={::this.updateFilter} />
          </div>
        </div>

        <div className="fluid-8">
          <Table id="recipe-list" sortable={true} hideFilterInput
            filterable={[
              { column: 'name', filterFunction: ::this.parseFilter },
              { column: 'action', filterFunction: ::this.parseFilter }
            ]}
            filterBy={this.state.searchQuery}>
            <Thead>
              <Th column="name">Name <i className="fa fa-sort post">&nbsp;</i></Th>
              <Th column="action">Action Name <i className="fa fa-sort post">&nbsp;</i></Th>
              <Th column="enabled">Enabled <i className="fa fa-sort post">&nbsp;</i></Th>
              <Th column="is_approved">Approved <i className="fa fa-sort post">&nbsp;</i></Th>
              <Th column="last_updated">Last Updated <i className="fa fa-sort post">&nbsp;</i></Th>
            </Thead>
            { recipes.map(recipe =>
              <Tr key={recipe.id} onClick={(e) => { ::this.viewRecipe(recipe); }}>
                <Td column="name" value={this.formatFilterValue(recipe, 'name')}>{recipe.name}</Td>
                <Td column="action" value={this.formatFilterValue(recipe, 'action')}>{recipe.action}</Td>
                <Td column="enabled" value={recipe.enabled ? 'Enabled' : 'Disabled'}><BooleanIcon value={recipe.enabled} /></Td>
                <Td column="is_approved" value={recipe.is_approved}><BooleanIcon value={recipe.is_approved} /></Td>
                <Td column="last_updated" value={recipe.last_updated}>{moment(recipe.last_updated).fromNow()}</Td>
              </Tr>
              )
            }
          </Table>
        </div>
      </div>
    )
  }
}

let mapStateToProps = (state, ownProps) => ({
  recipes: state.controlApp.recipes || [],
  dispatch: ownProps.dispatch
})

export default connect(
  mapStateToProps
)(RecipeList)
