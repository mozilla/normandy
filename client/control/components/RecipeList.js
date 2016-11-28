import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Table, Thead, Th, Tr, Td } from 'reactable';

import classNames from 'classnames';
import moment from 'moment';
import { makeApiRequest, recipesReceived, setSelectedRecipe } from 'control/actions/ControlActions';

import RecipeFilters from './RecipeFilters';

const BooleanIcon = props => {
  if (props.value) {
    return <i className="fa fa-lg fa-check green">&nbsp;</i>;
  }
  return <i className="fa fa-lg fa-times red">&nbsp;</i>;
};
BooleanIcon.propTypes = {
  value: pt.bool.isRequired,
};

class DisconnectedRecipeList extends React.Component {
  /**
   * Recipe metadata properties and associated labels to display
   * @type {Object}
   */
  static ActionMetadata = {
    'show-heartbeat': recipe => [
      { label: 'Survey ID', value: recipe.arguments.surveyId },
    ],
  };

  /**
   * Given a recipe object, determines what type of recipe it is (based on its `action`),
   * and then compiles an array of 'displayed metadata props' and their values. This array
   * is saved on the recipe as `metadata`, and displayed in the 'metadata'
   *
   * Beyond that, a string of metadata values is created, and attached to the
   * recipe as the `searchData` property. This is used by the `Table` component
   * to search/filter/sort the metadata.
   *
   * @param  {Object} Original recipe object
   * @return {Object} Original recipe but with `metadata` and `searchData` properties added
   */
  static applyRecipeMetadata(recipe) {
    const { action: recipeAction } = recipe;
    const newRecipe = {
      ...recipe,
      // recipes should have empty metadata/searchData props,
      // regardless if we set the values or not
      metadata: [],
      searchData: '',
    };

    // check if there are specific properties/labels we want to display
    const requestedMetaProps = DisconnectedRecipeList.ActionMetadata[recipeAction];

    // if we have a metadata definition to fill...
    if (requestedMetaProps) {
      // ...get the data we want to display
      const foundData = requestedMetaProps(newRecipe);

      // ...and add it to the existing metadata collection
      // (the data comes back as an array of objects,
      // so we can just concat it to our existing array)
      newRecipe.metadata = newRecipe.metadata.concat(foundData);
    }

    // update the searchdata string with whatever the values are
    // (this is used for sorting/filtering/searching)
    newRecipe.metadata.forEach(data => {
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
      displayedColumns: [],
    };

    this.updateFilter = ::this.updateFilter;
    this.updateSearch = ::this.updateSearch;
    this.onFilterChange = ::this.onFilterChange;
  }

  componentWillMount() {
    const { dispatch, isFetching, recipeListNeedsFetch } = this.props;
    dispatch(setSelectedRecipe(null));

    if (recipeListNeedsFetch && !isFetching) {
      dispatch(makeApiRequest('fetchAllRecipes', {}))
      .then(recipes => dispatch(recipesReceived(recipes)));
    }
  }

  onFilterChange(filters) {
    this.setState({
      displayedColumns: [].concat(filters || []),
    });
  }

  updateSearch(event) {
    this.setState({
      searchText: event.target.value,
    });
  }

  title = 'Recipes';

  viewRecipe(recipe) {
    const { dispatch } = this.props;
    dispatch(setSelectedRecipe(recipe.id));
    dispatch(push(`/control/recipe/${recipe.id}/`));
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

  renderTableCell(recipe) {
    return ({ value }) => {
      let displayValue = recipe[value];
      // if the value is a straight up boolean value,
      if (displayValue === true || displayValue === false) {
        // switch the displayed value to a ×/✓ mark
        displayValue = (
          <BooleanIcon
            value={displayValue}
          />
        );
      } else if (typeof displayValue === 'object') {
        displayValue = (
          <ul className="nested-list">
            {
              /* Display each nested property in a list */
              displayValue
                .map((nestedProp, index) => (
                  <li key={index}>
                    <span className="nested-label">{nestedProp.label}:</span>
                    {nestedProp.value}
                  </li>
                ))
            }
          </ul>
        );
      }

      return (
        <Td
          column={value}
          data={displayValue}
        >
          {displayValue}
        </Td>
      );
    };
  }

  render() {
    const { recipes } = this.props;
    const { displayedColumns } = this.state;
    let filteredRecipes = this.state.filteredRecipes || recipes;
    filteredRecipes = filteredRecipes.map(DisconnectedRecipeList.applyRecipeMetadata);

    return (
      <div>
        <RecipeFilters
          {...this.state}
          updateFilter={this.updateFilter}
          updateSearch={this.updateSearch}
          onFilterChange={this.onFilterChange}
        />
        <div className="fluid-8">
          <Table
            className="recipe-list"
            sortable
            hideFilterInput
            filterable={['name', 'action', 'metadata']}
            filterBy={this.state.searchText}
          >
            <Thead>
              {
                displayedColumns.map((col, index) =>
                  <Th
                    key={col.value + index}
                    column={col.value}
                  >
                    <span>{col.label}</span>
                  </Th>
                )
              }
            </Thead>
            {filteredRecipes.map(recipe =>
              <Tr
                key={recipe.id}
                onClick={() => { this.viewRecipe(recipe); }}
              >
                {
                  displayedColumns.map(this.renderTableCell(recipe))
                }
              </Tr>
            )}
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
  recipes: pt.array.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  recipes: state.recipes.list || [],
  dispatch: ownProps.dispatch,
  recipeListNeedsFetch: state.recipes.recipeListNeedsFetch,
  isFetching: state.controlApp.isFetching,
});

export default connect(
  mapStateToProps
)(DisconnectedRecipeList);
