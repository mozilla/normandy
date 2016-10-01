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
import _ from 'underscore';

import { makeApiRequest, recipeUpdated, recipeAdded, showNotification }
  from '../actions/ControlActions.js';
import composeRecipeContainer from './RecipeContainer.js';
import { ControlField } from './Fields.js';
import HeartbeatFields from './action_fields/HeartbeatFields.js';
import ConsoleLogFields from './action_fields/ConsoleLogFields.js';
import JexlEnvironment from '../../selfrepair/JexlEnvironment.js';

export const selector = formValueSelector('recipe');

/**
 * Form for creating new recipes or editing existing recipes.
 */
export class RecipeForm extends React.Component {
  static propTypes = {
    ...reduxFormPropTypes,
    selectedAction: pt.string,
    recipeId: pt.number,
    recipe: pt.shape({
      name: pt.string.isRequired,
      enabled: pt.bool.isRequired,
      filter_expression: pt.string.isRequired,
      action: pt.string.isRequired,
      arguments: pt.object.isRequired,
    }),
  }
  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': HeartbeatFields,
  };

  render() {
    const { handleSubmit, selectedAction, submitting, recipe, recipeId } = this.props;
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

    return (
      <form className="recipe-form" onSubmit={handleSubmit}>
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
          {recipeId &&
            <Link className="button delete" to={`/control/recipe/${recipeId}/delete/`}>
              Delete
            </Link>
          }
          <button className="button submit" type="submit" disabled={submitting}>Submit</button>
        </div>
      </form>
    );
  }
}

/**
 * Wrapper function that hooks the RecipeForm component up to redux-form.
 */
export const recipeReduxFormWrapper = reduxForm({
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

  onSubmit(values, dispatch, { recipeId }) {
    // Filter out unwanted keys for submission.
    const recipe = _.pick(values, [
      'name', 'enabled', 'filter_expression', 'action', 'arguments',
    ]);
    const requestBody = { recipeId, recipe };

    let result = null;
    if (recipeId) {
      result = dispatch(makeApiRequest('updateRecipe', requestBody))
      .then(response => dispatch(recipeUpdated(response)));
    } else {
      result = dispatch(makeApiRequest('addRecipe', requestBody))
      .then(response => {
        dispatch(recipeAdded(response));
        dispatch(push(`/control/recipe/${response.id}/`));
      });
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
});

/**
 * Component wrapper that passes the recipe (or currently selected revision) as
 * the initialValues prop for the form.
 * @param Component Component to wrap.
 */
export function recipeAsInitialValuesWrapper(Component) {
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

// Pulls the selected action name from the redux-form state.
const selectedActionConnector = connect(
  state => ({
    selectedAction: selector(state, 'action'),
  }),
);

// Use reduce to call several wrapper functions in a row.
export default [
  recipeReduxFormWrapper,
  selectedActionConnector,
  recipeAsInitialValuesWrapper,
  composeRecipeContainer,
].reduce((prev, func) => func(prev), RecipeForm);
