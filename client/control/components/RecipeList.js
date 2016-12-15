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
  getActiveColumns,
} from 'control/selectors/ColumnSelector';

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
      locales: [{
        label: 'English (US)',
        value: 'en-US',
      }],
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
    };

    this.handleSearchChange = ::this.handleSearchChange;
  }

  componentWillMount() {
    const { dispatch, isFetching, recipeListNeedsFetch } = this.props;
    dispatch(setSelectedRecipe(null));

    if (recipeListNeedsFetch && !isFetching) {
      dispatch(makeApiRequest('fetchAllRecipes', {}))
      .then(recipes => dispatch(recipesReceived(recipes)));
    }
  }

  handleSearchChange(event) {
    this.setState({
      searchText: event.target.value || '',
    });
  }

  viewRecipe(recipe) {
    const { dispatch } = this.props;
    dispatch(setSelectedRecipe(recipe.id));
    dispatch(push(`/control/recipe/${recipe.id}/`));
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
    const {
      recipes,
      displayedColumns,
    } = this.props;

    const {
      searchText,
    } = this.state;

    const filteredRecipes = (this.state.filteredRecipes || recipes)
      .map(DisconnectedRecipeList.applyRecipeMetadata);

    return (
      <div>
        <RecipeFilters
          {...this.state}
          displayCount={filteredRecipes.length}
          totalCount={recipes.length}
          onSearchChange={this.handleSearchChange}
        />
        <div className="fluid-8">
          <Table
            className="recipe-list"
            sortable
            hideFilterInput
            filterable={['name', 'action', 'metadata']}
            filterBy={searchText}
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

const mapStateToProps = (state, ownProps) => ({
  dispatch: ownProps.dispatch,
  isFetching: state.controlApp.isFetching,
  recipes: state.recipes.list || [],
  recipeListNeedsFetch: state.recipes.recipeListNeedsFetch,
  displayedColumns: getActiveColumns(state.columns),
});

export default connect(
  mapStateToProps
)(DisconnectedRecipeList);
