import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Table, Thead, Th, Tr, Td } from 'reactable';

import {
  makeApiRequest,
  recipesReceived,
  setSelectedRecipe,
} from 'control/actions/ControlActions';

import {
  getActiveFilters,
} from 'control/selectors/FiltersSelector';

import RecipeFilters from 'control/components/RecipeFilters';

const BooleanIcon = props => {
  const iconClass = props.value ? 'fa-check green' : 'fa-times red';
  return <i className={`fa fa-lg ${iconClass}`}>&nbsp;</i>;
};
BooleanIcon.propTypes = {
  value: pt.bool.isRequired,
};

class DisconnectedRecipeList extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    isFetching: pt.bool.isRequired,
    recipeListNeedsFetch: pt.bool.isRequired,
    recipes: pt.array.isRequired,
    activeFilters: pt.array.isRequired,
  };

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
  static applyRecipeMetadata(recipe, index) {
    const { action: recipeAction } = recipe;
    const newRecipe = {
      ...recipe,
      // recipes should have empty metadata/searchData props,
      // regardless if we set the values or not
      metadata: [],
      searchData: '',
      locales: [{
        label: 'English (US)',
        value: 'en-US',
      }].concat(index % 2 === 0 ? [{
        label: 'German',
        value: 'de',
      }] : []),
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
      displayedColumns: [],
    };

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

  applyFiltersToRecipes(filters, recipes) {
    let newRecipes = [].concat(recipes || []);

    if (!filters || filters.length === 0) {
      return newRecipes;
    }

    newRecipes = newRecipes.filter(recipe => {
      let validCount = 0;
      const filterCount = filters.length;

      filters.forEach(filter => {
        const property = filter.value;
        const filteredValues = (filter.options || [])
          .filter(option => option.selected)
          .map(option => option.value);

        // Get the recipe's value for this property
        let recipeValues = typeof recipe[property] !== 'undefined' ? recipe[property] : [];

        // We compare using arrays,
        // so if the value is just a single value
        // we need to wrap it in an array
        if (recipeValues instanceof Array) {
          // We want only an array of the values
          recipeValues = recipeValues.map(option => option.value);
        } else {
          recipeValues = [recipeValues];
        }

        // compare using Array.every and indexOf
        const recipeHasAllFilters = (filteredValues || [])
          .every(val => recipeValues.indexOf(val) >= 0);

        // if the recipe has all the filters for this property,
        // increase the 'valid count'
        if (recipeHasAllFilters) {
          validCount += 1;
        }
      });

      // if all filter properties have been satisfied,
      // this recipe can be shown!
      return validCount === filterCount;
    });

    return newRecipes;
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
                    <span className="nested-label">{`${nestedProp.label}: `}</span>
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

    filteredRecipes = this.applyFiltersToRecipes(this.props.activeFilters, filteredRecipes);

    const noResults = filteredRecipes.length === 0;
    const isFiltering = !!this.props.activeFilters.length;

    return (
      <div>
        <RecipeFilters
          {...this.state}
          updateSearch={this.updateSearch}
          onFilterChange={this.onFilterChange}
          displayCount={filteredRecipes.length}
          totalCount={recipes.length}
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

          {
            noResults && (isFiltering ?
              <div className="callout">No recipes match those filters.</div>
            : <div className="callout">No recipes to display.</div>)
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  recipes: state.recipes.list || [],
  dispatch: ownProps.dispatch,
  recipeListNeedsFetch: state.recipes.recipeListNeedsFetch,
  isFetching: state.controlApp.isFetching,
  activeFilters: getActiveFilters(state.filters),
});

export default connect(
  mapStateToProps
)(DisconnectedRecipeList);
