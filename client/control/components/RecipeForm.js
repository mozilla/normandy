/* eslint-disable import/no-named-as-default */
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { Link, locationShape } from 'react-router';
import { push } from 'react-router-redux';
import {
  reduxForm,
  formValueSelector,
  propTypes as reduxFormPropTypes,
  SubmissionError,
} from 'redux-form';
import { pick } from 'underscore';

import {
  makeApiRequest,
  recipeUpdated,
  recipeAdded,
  showNotification,
  setSelectedRecipe,
}
  from 'control/actions/ControlActions';
import composeRecipeContainer from 'control/components/RecipeContainer';
import { ControlField } from 'control/components/Fields';
import HeartbeatFields from 'control/components/action_fields/HeartbeatFields';
import ConsoleLogFields from 'control/components/action_fields/ConsoleLogFields';
import JexlEnvironment from 'selfrepair/JexlEnvironment';


export const selector = formValueSelector('recipe');

/**
 * Form for creating new recipes or editing existing recipes.
 */
export class RecipeForm extends React.Component {
  static propTypes = {
    handleSubmit: reduxFormPropTypes.handleSubmit,
    submitting: reduxFormPropTypes.submitting,
    selectedAction: pt.string,
    recipeId: pt.number,
    recipe: pt.shape({
      name: pt.string.isRequired,
      enabled: pt.bool.isRequired,
      filter_expression: pt.string.isRequired,
      action: pt.string.isRequired,
      arguments: pt.object.isRequired,
    }),
    // route prop passed from router
    route: pt.object,
  };

  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': HeartbeatFields,
  };

  renderCloningMessage() {
    const isCloning = this.props.route && this.props.route.isCloning;
    const displayedRecipe = this.props.recipe || {};

    return isCloning &&
      (<span className="cloning-message callout">
        {'You are cloning '}
        <Link to={`/control/recipe/${displayedRecipe.id}/`}>
          {displayedRecipe.name} ({displayedRecipe.action})
        </Link>.
      </span>);
  }

  render() {
    const {
      handleSubmit,
      selectedAction,
      submitting,
      recipe,
      recipeId,
      route,
    } = this.props;
    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction] || null;

    // Show a loading indicator if we haven't yet loaded the recipe.
    if (recipeId && !recipe) {
      return (
        <div className="recipe-form loading">
          <i className="fa fa-spinner fa-spin fa-3x fa-fw" />
          <p>Loading recipe...</p>
        </div>
      );
    }

    const isCloning = route && route.isCloning;

    const submitButtonCaption = recipeId && !isCloning ? 'Update Recipe' : 'Add New Recipe';

    return (
      <form className="recipe-form" onSubmit={handleSubmit}>
        { this.renderCloningMessage() }

        <ControlField label="Name" name="name" component="input" type="text" />
        <ControlField
          label="Enabled"
          name="enabled"
          className="checkbox-field"
          component="input"
          type="checkbox"
        />
        <ControlField
          label="Filter Expression"
          name="filter_expression"
          component="textarea"
        />
        <ControlField label="Action" name="action" component="select">
          <option value="">Choose an action...</option>
          <option value="console-log">Log to Console</option>
          <option value="show-heartbeat">Heartbeat Prompt</option>
        </ControlField>
        {ArgumentsFields && <ArgumentsFields />}
        <div className="form-actions">
          {recipeId && !isCloning &&
            <Link className="button delete" to={`/control/recipe/${recipeId}/delete/`}>
              Delete
            </Link>
          }
          <button className="button submit" type="submit" disabled={submitting}>
            {submitButtonCaption}
          </button>
        </div>
      </form>
    );
  }
}

/**
 * Redux-Form config for the RecipeForm.
 */
export const formConfig = {
  form: 'recipe',
  asyncBlurFields: ['filter_expression'],

  async asyncValidate(values) {
    const errors = {};
    // Validate that filter expression is valid JEXL
    if (!values.filter_expression) {
      errors.filter_expression = 'Filter expression cannot be empty.';
    } else {
      const jexlEnvironment = new JexlEnvironment({});
      try {
        await jexlEnvironment.eval(values.filter_expression);
      } catch (err) {
        errors.filter_expression = err.toString();
      }
    }

    // Throw if we found any errors.
    if (Object.keys(errors).length > 0) {
      throw errors;
    }
  },

  onSubmit(values, dispatch, { route, recipeId, updateRecipe, addRecipe }) {
    // Filter out unwanted keys for submission.
    const recipe = pick(values, [
      'name', 'enabled', 'filter_expression', 'action', 'arguments',
    ]);
    const isCloning = route && route.isCloning;

    let result;
    if (recipeId && !isCloning) {
      result = updateRecipe(recipeId, recipe);
    } else {
      result = addRecipe(recipe);
    }


    // Wrap error responses with a SubmissionError for redux-form.
    return result.catch(errors => {
      throw new SubmissionError(errors);
    });
  },

  onSubmitSuccess(result, dispatch) {
    dispatch(showNotification({
      messageType: 'success',
      message: 'Recipe saved.',
    }));
  },

  onSubmitFail(errors, dispatch) {
    dispatch(showNotification({
      messageType: 'error',
      message: 'Recipe cannot be saved. Please correct any errors listed in the form below.',
    }));
  },
};

/**
 * Component wrapper that passes the recipe (or currently selected revision) as
 * the initialValues prop for the form.
 * @param Component Component to wrap.
 */
export function initialValuesWrapper(Component) {
  function Wrapped(props) {
    const { recipe, location } = props;
    let initialValues = recipe;
    if (location.state && location.state.selectedRevision) {
      initialValues = location.state.selectedRevision;
    }
    return <Component initialValues={initialValues} {...props} />;
  }
  Wrapped.propTypes = {
    recipe: pt.object,
    location: locationShape,
  };

  return Wrapped;
}

const connector = connect(
  // Pull selected action from the form state.
  state => ({
    selectedAction: selector(state, 'action'),
  }),

  // Bound functions for writing to the server.
  dispatch => ({
    addRecipe(recipe) {
      return dispatch(makeApiRequest('addRecipe', { recipe }))
      .then(response => {
        dispatch(recipeAdded(response));
        dispatch(push(`/control/recipe/${response.id}/`));
        dispatch(setSelectedRecipe(response.id));
      });
    },
    updateRecipe(recipeId, recipe) {
      return dispatch(makeApiRequest('updateRecipe', { recipeId, recipe }))
      .then(response => dispatch(recipeUpdated(response)));
    },
  }),
);

// Use reduce to call several wrapper functions in a row.
export default [
  reduxForm(formConfig),
  connector,
  initialValuesWrapper,
  composeRecipeContainer,
].reduce((prev, func) => func(prev), RecipeForm);
