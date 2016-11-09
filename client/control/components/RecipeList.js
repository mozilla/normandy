import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Table, Thead, Th, Tr, Td } from 'reactable';
import classNames from 'classnames';
import moment from 'moment';
import { makeApiRequest, recipesReceived, setSelectedRecipe } from '../actions/ControlActions.js';

const BooleanIcon = props => {
  if (props.value) {
    return <i className="fa fa-lg fa-check green">&nbsp;</i>;
  }
  return <i className="fa fa-lg fa-times red">&nbsp;</i>;
};
BooleanIcon.propTypes = {
  value: pt.bool.isRequired,
};

function FilterBar({ searchText, selectedFilter, updateSearch, updateFilter }) {
  return (
    <div id="secondary-header" className="fluid-8">
      <div className="fluid-2">
        <div className="search input-with-icon">
          <input type="text" placeholder="Search" value={searchText} onChange={updateSearch} />
        </div>
      </div>
      <div id="filters-container" className="fluid-6">
        <h4>Filter By:</h4>
        <SwitchFilter
          options={['All', 'Enabled', 'Disabled']}
          selectedFilter={selectedFilter}
          updateFilter={updateFilter}
        />
      </div>
    </div>
  );
}
FilterBar.propTypes = {
  searchText: pt.string.isRequired,
  selectedFilter: pt.any.isRequired,
  updateSearch: pt.func.isRequired,
  updateFilter: pt.func.isRequired,
};

function SwitchFilter({ options, selectedFilter, updateFilter }) {
  return (
    <div className="switch">
      <div className={`switch-selection position-${options.indexOf(selectedFilter)}`}>&nbsp;</div>
      {options.map(option =>
        <span
          key={option}
          className={classNames({ active: (option === selectedFilter) })}
          onClick={() => updateFilter(option)}
        >{option}
        </span>
      )}
    </div>
  );
}
SwitchFilter.propTypes = {
  options: pt.object.isRequired,
  selectedFilter: pt.any.isRequired,
  updateFilter: pt.func.isRequired,
};

class DisconnectedRecipeList extends React.Component {
  /**
   * Recipe metadata properties and associated labels to display
   * @type {Object}
   */
  static ActionMetaData = {
    'show-heartbeat': recipe => [
      { label: 'Survey ID', value: recipe.arguments.surveyId },
    ],
  };

  /**
   * Given a recipe object, determines what type of recipe it is (based on its `action`),
   * and then compiles an array of 'displayed metadata props' and their values. This array
   * is saved on the recipe as `metaData`, and displayed in the 'Metadata'
   *
   * Beyond that, a string of metaData values is created, and attached to the
   * recipe as the `searchData` property. This is used by the `Table` component
   * to search/filter/sort the metaData.
   *
   * @param  {Object} Original recipe object
   * @return {Object} Original recipe but with `metaData` and `searchData` properties added
   */
  static applyRecipeMetaData(recipe) {
    const { action: recipeAction } = recipe;
    const newRecipe = {
      ...recipe,
      // recipes should have empty metaData/searchData props,
      // regardless if we set the values or not
      metaData: [],
      searchData: '',
    };

    // check if there are specific properties/labels we want to display
    const requestedMetaProps = DisconnectedRecipeList.ActionMetaData[recipeAction];

    // if we have a metaData definition to fill...
    if (requestedMetaProps) {
      // ...get the data we want to display
      const foundData = requestedMetaProps(newRecipe);

      // ...and add it to the existing metaData collection
      // (the data comes back as an array of objects,
      // so we can just concat it to our existing array)
      newRecipe.metaData = newRecipe.metaData.concat(foundData);
    }

    // update the searchdata string with whatever the values are
    // (this is used for sorting/filtering/searching)
    newRecipe.metaData.forEach(data => {
      newRecipe.searchData = `${newRecipe.searchData} ${data.value}`;
    });

    return newRecipe;
  }


  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      filteredRecipes: null,
      selectedFilter: 'All',
    };

    this.updateFilter = ::this.updateFilter;
    this.updateSearch = ::this.updateSearch;
  }

  componentWillMount() {
    const { dispatch, isFetching, recipeListNeedsFetch } = this.props;
    dispatch(setSelectedRecipe(null));

    if (recipeListNeedsFetch && !isFetching) {
      dispatch(makeApiRequest('fetchAllRecipes', {}))
      .then(recipes => dispatch(recipesReceived(recipes)));
    }
  }

  title = 'Recipes';

  viewRecipe(recipe) {
    const { dispatch } = this.props;
    dispatch(setSelectedRecipe(recipe.id));
    dispatch(push(`/control/recipe/${recipe.id}/`));
  }

  updateSearch(event) {
    this.setState({
      searchText: event.target.value,
    });
  }

  updateFilter(filterStatus) {
    const { recipes } = this.props;

    if (filterStatus === 'All') {
      this.setState({
        filteredRecipes: null,
        selectedFilter: filterStatus,
      });
    } else {
      const enabledState = filterStatus === 'Enabled';
      this.setState({
        filteredRecipes: recipes.filter(recipe => recipe.enabled === enabledState),
        selectedFilter: filterStatus,
      });
    }
  }

  render() {
    const { recipes } = this.props;
    let filteredRecipes = this.state.filteredRecipes || recipes;
    filteredRecipes = filteredRecipes.map(DisconnectedRecipeList.applyRecipeMetaData);

    return (
      <div>
        <FilterBar
          {...this.state}
          updateFilter={this.updateFilter}
          updateSearch={this.updateSearch}
        />
        <div className="fluid-8">
          <Table
            id="recipe-list"
            sortable
            hideFilterInput
            filterable={['name', 'action', 'metadata']}
            filterBy={this.state.searchText}
          >
            <Thead>
              <Th column="name"><span>Name</span></Th>
              <Th column="action"><span>Action Name</span></Th>
              <Th column="enabled"><span>Enabled</span></Th>
              <Th column="last_updated"><span>Last Updated</span></Th>
              <Th column="metadata"><span>Metadata</span></Th>
            </Thead>
            {filteredRecipes.map(recipe =>
              <Tr key={recipe.id} onClick={() => { this.viewRecipe(recipe); }}>
                <Td column="name">{recipe.name}</Td>
                <Td column="action">{recipe.action}</Td>
                <Td column="enabled" value={recipe.enabled}>
                  <BooleanIcon value={recipe.enabled} />
                </Td>
                <Td column="last_updated" value={recipe.last_updated}>
                  {moment(recipe.last_updated).fromNow()}
                </Td>
                <Td column="metadata" value={recipe.searchData}>
                  <ul className="metadata-list">
                    {
                      /* Display each metadata property in a list */
                      recipe.metaData
                        .map((metaProp, index) => (
                          <li key={index}>
                            <span className="metadata-label">{metaProp.label}:</span>
                            {metaProp.value}
                          </li>
                        ))
                    }
                  </ul>
                </Td>
              </Tr>
              )
            }
          </Table>
        </div>
      </div>
    );
  }
}

DisconnectedRecipeList.propTypes = {
  dispatch: pt.func.isRequired,
  isFetching: pt.bool.isRequired,
  recipeListNeedsFetch: pt.bool.isRequired,
  recipe: pt.object.isRequired,
  recipes: pt.array.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  recipes: state.controlApp.recipes || [],
  dispatch: ownProps.dispatch,
  recipeListNeedsFetch: state.controlApp.recipeListNeedsFetch,
  isFetching: state.controlApp.isFetching,
});

export default connect(
  mapStateToProps
)(DisconnectedRecipeList);
