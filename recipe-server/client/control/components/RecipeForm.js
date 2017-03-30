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

import makeApiRequest from 'control/api';

import {
  recipeUpdated,
  recipeAdded,
  setSelectedRecipe,
} from 'control/actions/RecipeActions';

import {
  showNotification,
} from 'control/actions/NotificationActions';

import composeRecipeContainer from 'control/components/RecipeContainer';
import { ControlField } from 'control/components/Fields';
import HeartbeatFields from 'control/components/action_fields/HeartbeatFields';
import ConsoleLogFields from 'control/components/action_fields/ConsoleLogFields';
import PreferenceExperimentFields from
  'control/components/action_fields/PreferenceExperimentFields';


export const selector = formValueSelector('recipe');

// The arguments field is handled in initialValuesWrapper.
const DEFAULT_FORM_VALUES = {
  name: '',
  extra_filter_expression: '',
  action: '',
};

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
      extra_filter_expression: pt.string.isRequired,
      action: pt.string.isRequired,
      arguments: pt.object.isRequired,
    }),
    // route prop passed from router
    route: pt.object,
  };

  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': HeartbeatFields,
    'preference-experiment': PreferenceExperimentFields,
  };

  renderCloningMessage() {
    const isCloning = this.props.route && this.props.route.isCloning;
    const displayedRecipe = this.props.recipe;

    if (!isCloning || !displayedRecipe) {
      return null;
    }

    return (
      <span className="cloning-message callout">
        {'You are cloning '}
        <Link to={`/control/recipe/${displayedRecipe.id}/`}>
          {displayedRecipe.name} ({displayedRecipe.action})
        </Link>.
      </span>
    );
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
    const noop = () => null;
    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction] || noop;

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
          name="extra_filter_expression"
          component="textarea"
        />
        <ControlField label="Action" name="action" component="select">
          <option value="">Choose an action...</option>
          <option value="console-log">Log to Console</option>
          <option value="show-heartbeat">Heartbeat Prompt</option>
          <option value="preference-experiment">Preference Experiment</option>
        </ControlField>
        <ArgumentsFields />
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
  asyncBlurFields: ['extra_filter_expression'],
  enableReinitialize: true,
  keepDirtyOnReinitialize: true,

  async asyncValidate(values) {
    const errors = {};
    // Validate that filter expression is not empty
    if (!values.extra_filter_expression) {
      errors.extra_filter_expression = 'Filter expression cannot be empty.';
    }

    // Throw if we found any errors.
    if (Object.keys(errors).length > 0) {
      throw errors;
    }
  },

  onSubmit(values, dispatch, { route, recipeId, updateRecipe, addRecipe }) {
    // Filter out unwanted keys for submission.
    const recipe = pick(values, [
      'name', 'enabled', 'extra_filter_expression', 'action', 'arguments',
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
    const { recipe, location, selectedAction } = props;
    let initialValues = recipe;
    if (location.state && location.state.selectedRevision) {
      initialValues = location.state.selectedRevision;
    }

    // If we still don't have initial values, roll with the defaults.
    if (!initialValues) {
      initialValues = { ...DEFAULT_FORM_VALUES, arguments: {} };

      // ActionField subclasses define their own initial values.
      if (selectedAction) {
        const ActionFields = RecipeForm.argumentsFields[selectedAction];
        initialValues.arguments = { ...ActionFields.initialValues };
      }
    }

    return <Component initialValues={initialValues} {...props} />;
  }
  Wrapped.propTypes = {
    recipe: pt.object,
    location: locationShape,
    selectedAction: pt.string,
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
  initialValuesWrapper,
  connector,
  composeRecipeContainer,
].reduce((prev, func) => func(prev), RecipeForm);
