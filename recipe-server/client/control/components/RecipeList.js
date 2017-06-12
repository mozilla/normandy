import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Table, Thead, Th, Tr, Td } from 'reactable';
import { isObject } from 'underscore';

import makeApiRequest from 'control/api';

import {
  recipesReceived,
  setSelectedRecipe,
} from 'control/actions/RecipeActions';

import {
  getRecipesList,
} from 'control/selectors/RecipesSelector';

import {
  getActiveColumns,
} from 'control/selectors/ColumnSelector';

import BooleanIcon from 'control/components/BooleanIcon';
import RecipeFilters from 'control/components/RecipeFilters';

export class DisconnectedRecipeList extends React.Component {
  static propTypes = {
    // connected
    dispatch: pt.func.isRequired,
    isFetching: pt.bool.isRequired,
    recipeListNeedsFetch: pt.bool.isRequired,
    recipes: pt.array.isRequired,
    displayedColumns: pt.array.isRequired,
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
   * is saved on the recipe as `metadata`, and displayed in the 'metadata' column.
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

    this.state = {};
    this.handlerCache = {};

    this.handleViewRecipe = ::this.handleViewRecipe;
  }

  componentWillMount() {
    const { dispatch, isFetching, recipeListNeedsFetch } = this.props;
    dispatch(setSelectedRecipe(null));

    if (recipeListNeedsFetch && !isFetching) {
      dispatch(makeApiRequest('fetchAllRecipes', {}))
        .then(recipes => dispatch(recipesReceived(recipes)));
    }
  }

  /**
   * Event handler factory for user attempting to 'view recipe.'
   * Caches generated functions to prevent lots of function
   * creation on each render loop.
   *
   * @param  {string}   recipe  Recipe object that the user is trying to view
   * @return {function}         Generated event handler for this recipe
   */
  handleViewRecipe(recipe) {
    if (!this.handlerCache[recipe.id]) {
      const { dispatch } = this.props;

      this.handlerCache[recipe.id] = () => {
        dispatch(setSelectedRecipe(recipe.id));
        dispatch(push(`/control/recipe/${recipe.id}/revision/${recipe.latest_revision_id}`));
      };
    }

    return () => {
      this.handlerCache[recipe.id]();
    };
  }

  renderTableCell(recipe) {
    return ({ slug }) => {
      let displayValue = recipe[slug];
      // if the value is a straight up boolean value,
      if (displayValue === true || displayValue === false) {
        // switch the displayed value to a ×/✓ mark
        displayValue = (
          <BooleanIcon
            value={displayValue}
          />
        );
      } else if (isObject(displayValue)) {
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
          key={slug}
          column={slug}
          data={displayValue}
        >
          {displayValue}
        </Td>
      );
    };
  }

  render() {
    const {
      recipes,
      displayedColumns,
      recipeListNeedsFetch,
    } = this.props;

    const filteredRecipes = [].concat(recipes)
      .map(DisconnectedRecipeList.applyRecipeMetadata);

    const noResults = filteredRecipes.length > 0;

    return (
      <div>
        <RecipeFilters />
        <div className="fluid-8">
          {
            !noResults && recipeListNeedsFetch &&
              <div
                className="loading callout"
                children={'Loading...'}
              />
          }

          <Table
            className="recipe-list"
            sortable
            hideFilterInput
            filterable={['name', 'action', 'metadata']}
          >
            <Thead>
              {
                displayedColumns.map((col, index) =>
                  <Th
                    key={col.slug + index}
                    column={col.slug}
                  >
                    <span>{col.label}</span>
                  </Th>
                )
              }
            </Thead>
            {filteredRecipes.map(recipe =>
              <Tr
                key={recipe.id}
                onClick={this.handleViewRecipe(recipe)}
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

const mapStateToProps = (state, ownProps) => ({
  recipes: getRecipesList(state.recipes, state.filters),
  dispatch: ownProps.dispatch,
  recipeListNeedsFetch: state.recipes.recipeListNeedsFetch,
  isFetching: state.controlApp.isFetching,
  displayedColumns: getActiveColumns(state.columns),
});

export default connect(
  mapStateToProps
)(DisconnectedRecipeList);
