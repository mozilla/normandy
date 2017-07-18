import { message, Button, Icon, Dropdown, Menu } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { SimpleLoadingOverlay } from 'control_new/components/common/LoadingOverlay';
import RecipeForm from 'control_new/components/recipes/RecipeForm';
import QueryRecipe from 'control_new/components/data/QueryRecipe';

import { updateRecipe } from 'control_new/state/recipes/actions';
import { getRecipe } from 'control_new/state/recipes/selectors';
import { getRouterParamAsInt } from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getRouterParamAsInt(state, 'recipeId');

    return {
      recipeId,
      recipe: getRecipe(state, recipeId, new Map()),
    };
  },
  {
    updateRecipe,
  },
)
@autobind
export default class EditRecipePage extends React.Component {
  static propTypes = {
    updateRecipe: PropTypes.func.isRequired,
    recipeId: PropTypes.number.isRequired,
    recipe: PropTypes.instanceOf(Map),
  };

  static defaultProps = {
    recipe: null,
  };

  static ActionMenu = (
    <Menu>
      <Menu.Item>
        <a href="clone">Clone Recipe</a>
      </Menu.Item>
    </Menu>
  );

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(values) {
    const { recipeId } = this.props;

    try {
      await this.props.updateRecipe(recipeId, values);
      message.success('Recipe saved');
      this.setState({
        formErrors: undefined,
      });
    } catch (error) {
      message.error(
        'Recipe cannot be saved. Please correct any errors listed in the form below.',
      );

      if (error) {
        this.setState({
          formErrors: error.data || error,
        });
      }
    }
  }

  render() {
    const { recipe, recipeId } = this.props;
    const recipeName = recipe.get('name');

    return (
      <div className="edit-page">
        <QueryRecipe pk={recipeId} />
        <SimpleLoadingOverlay isVisible={!recipeName}>
          <h2>Edit Recipe</h2>

          {
            recipeName &&
            <Dropdown overlay={EditRecipePage.ActionMenu} placement="bottomRight" trigger={['click']}>
              <Button className="action-button"><Icon type="setting" /></Button>
            </Dropdown>
          }

          <RecipeForm
            recipe={recipe}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        </SimpleLoadingOverlay>
      </div>
    );
  }
}
