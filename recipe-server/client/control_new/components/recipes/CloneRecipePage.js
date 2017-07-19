import { message } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link, push as pushAction } from 'redux-little-router';

import { SimpleLoadingOverlay } from 'control_new/components/common/LoadingOverlay';
import RecipeForm from 'control_new/components/recipes/RecipeForm';
import QueryRecipe from 'control_new/components/data/QueryRecipe';

import { createRecipe as createAction } from 'control_new/state/recipes/actions';
import { getRecipeFromURL } from 'control_new/state/recipes/selectors';

@connect(
  state => {
    const {
      isLatestRevision,
      recipe,
      recipeId,
      revisionId,
    } = getRecipeFromURL(state);

    return {
      isLatestRevision,
      recipe,
      recipeId,
      revisionId,
    };
  },
  {
    push: pushAction,
    createRecipe: createAction,
  },
)
@autobind
export default class CloneRecipePage extends React.Component {
  static propTypes = {
    createRecipe: PropTypes.func.isRequired,
    isLatestRevision: PropTypes.bool,
    recipeId: PropTypes.number.isRequired,
    recipe: PropTypes.instanceOf(Map),
    revisionId: PropTypes.string.isRequired,
  };

  static defaultProps = {
    recipe: null,
    isLatestRevision: false,
  };

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(values) {
    const { push } = this.props;

    try {
      const newId = await this.props.createRecipe(values);

      message.success('Recipe saved');
      this.setState({
        formErrors: undefined,
      });

      push(`/recipe/${newId}`);
    } catch (error) {
      message.error(
        'Recipe cannot be saved. Please correct any errors listed in the form below.',
      );

      this.setState({
        formErrors: error.data || error,
      });
    }
  }

  render() {
    const { recipe, recipeId, isLatestRevision, revisionId } = this.props;
    const recipeName = recipe.get('name');

    // Remove the 'name' field value.
    const displayedRecipe = recipe.set('name');

    // URL and text for the "Cloning this from [a recipe]" link
    const originalRecipeURL = `/recipe/${recipeId}${isLatestRevision ? '' : `/rev/${revisionId}`}`;

    // Only display revision hash if we're _not_ on the latest version.
    const revisionAddendum = isLatestRevision ? '' : `(revision ${revisionId.slice(0, 7)}...)`;
    const originalRecipeText = `"${recipeName}" ${revisionAddendum}`;

    return (
      <div className="clone-page">
        <QueryRecipe pk={recipeId} />
        <SimpleLoadingOverlay isVisible={!recipeName}>
          <h2>New Recipe</h2>
          { recipeName &&
            <h3>
              {'Cloning recipe values from '}
              <Link href={originalRecipeURL}>{originalRecipeText}</Link>
            </h3>
          }

          <RecipeForm
            recipe={displayedRecipe}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        </SimpleLoadingOverlay>
      </div>
    );
  }
}
