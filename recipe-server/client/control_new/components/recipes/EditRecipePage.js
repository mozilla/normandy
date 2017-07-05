import { message, Spin } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import QueryRecipe from 'control_new/components/data/QueryRecipe';
import RecipeForm from 'control_new/components/recipes/RecipeForm';
import { updateRecipe } from 'control_new/state/recipes/actions';
import { getCurrentRecipe, getCurrentRecipePk } from 'control_new/state/recipes/selectors';


@connect(
  state => ({
    recipePk: getCurrentRecipePk(state),
    recipe: getCurrentRecipe(state),
  }),
  {
    updateRecipe,
  },
)
@autobind
export default class EditRecipePage extends React.Component {
  static propTypes = {
    updateRecipe: pt.func.isRequired,
    recipePk: pt.number,
    recipe: pt.instanceOf(Map),
  }

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(values) {
    const { recipePk } = this.props;
    try {
      await this.props.updateRecipe(recipePk, values);
      message.success('Recipe saved');
      this.setState({ formErrors: undefined });
    } catch (error) {
      message.error(
        'Recipe cannot be saved. Please correct any errors listed in the form below.',
      );
      if (error.data) {
        this.setState({ formErrors: error.data });
      }
    }
  }

  render() {
    const { recipe, recipePk } = this.props;
    const Wrapper = recipe ? 'div' : Spin;
    return (
      <Wrapper>
        <h2>Edit Recipe</h2>
        <QueryRecipe pk={recipePk} />
        {recipe &&
          <RecipeForm
            recipe={recipe}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        }
      </Wrapper>
    );
  }
}
