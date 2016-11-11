import React, { PropTypes as pt } from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { destroy, reset, stopSubmit, reduxForm, getValues } from 'redux-form';
import { _ } from 'underscore';

import { makeApiRequest, recipeUpdated, recipeAdded, showNotification }
  from '../actions/ControlActions.js';
import composeRecipeContainer from './RecipeContainer.js';
import ActionForm from './ActionForm.js';
import CheckboxField from './form_fields/CheckboxField.js';
import FormField from './form_fields/FormFieldWrapper.js';
import JexlEnvironment from '../../selfrepair/JexlEnvironment.js';

export class DisconnectedRecipeForm extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    fields: pt.object.isRequired,
    formState: pt.object.isRequired,
    recipeId: pt.number.isRequired,
    submitting: pt.bool.isRequired,
    recipe: pt.object.isRequired,
    handleSubmit: pt.func.isRequired,
    viewingRevision: pt.bool.isRequired,
    // route is passed in from redux/the router
    route: pt.object,
    // isCloning is `true` when the user is cloning
    // a pre-existing recipe
    isCloning: pt.bool,
  }

  constructor(props) {
    super(props);

    this.state = {
      availableActions: ['console-log', 'show-heartbeat'],
      selectedAction: null,
    };

    this.submitForm = ::this.submitForm;
    this.changeAction = ::this.changeAction;
  }

  componentWillReceiveProps(nextProps) {
    const isGainingRecipe = !this.state.selectedAction && nextProps.recipe;
    const recipeIsChanging = nextProps.recipe && nextProps.recipe.id !== this.props.recipeId;
    const userCancelledCloning = this.props.route.isCloning && !nextProps.route.isCloning;

    if (isGainingRecipe || recipeIsChanging) {
      const selectedActionName = nextProps.recipe.action;
      this.setState({
        selectedAction: { name: selectedActionName },
      });
    } else if (userCancelledCloning) {
      const { dispatch } = this.props;
      // if the user decided to stop cloning,
      // we want to revert fields back to what they were to begin with
      dispatch(reset('recipe'));
    }
  }

  changeAction(event) {
    const { dispatch, fields } = this.props;
    const selectedActionName = event.target.value;

    dispatch(destroy('action'));
    fields.action.onChange(event);
    this.setState({
      selectedAction: { name: selectedActionName },
    });
  }

  validateForm(formValues) {
    const jexlExpression = formValues.filter_expression;
    const jexlEnv = new JexlEnvironment({});
    return jexlEnv.eval(jexlExpression, {});
  }

  submitForm() {
    const { dispatch, formState, recipeId } = this.props;
    const { isCloning } = this.props.route;

    const recipeFormValues = getValues(formState.recipe);
    const actionFormValues = getValues(formState.action);
    const combinedFormValues = { ...recipeFormValues, arguments: actionFormValues };
    const requestBody = { recipe: combinedFormValues, recipeId: isCloning ? null : recipeId };

    return this.validateForm(combinedFormValues)
    .catch(() => {
      dispatch(showNotification({
        messageType: 'error',
        message: 'Recipe cannot be saved. Please correct any errors listed in the form below.',
      }));
      throw {
        filter_expression: 'Invalid Expression',
      };
    })
    .then(() => {
      if (recipeId && !isCloning) {
        return dispatch(makeApiRequest('updateRecipe', requestBody))
        .then(response => dispatch(recipeUpdated(response)));
      }
      return dispatch(makeApiRequest('addRecipe', requestBody))
      .then(response => {
        dispatch(recipeAdded(response));
        dispatch(push(`/control/recipe/${response.id}/`));
      });
    });
  }

  render() {
    const {
      fields: { name, filter_expression: filterExpression, enabled, action },
      submitting, recipe, recipeId, handleSubmit, viewingRevision,
    } = this.props;
    const { availableActions, selectedAction } = this.state;
    const { isCloning } = this.props.route;

    const submitButtonCaption = recipeId && !isCloning ? 'Update Recipe' : 'Add New Recipe';

    return (
      <form onSubmit={handleSubmit(this.submitForm)} className="crud-form fluid-8">
        {
          isCloning ?
            <span>
              You're cloning {recipe.name} ({recipe.action}).
              <div>
                <Link
                  className="button delete"
                  to={`/control/recipe/${recipe.id}/`}
                >
                  Cancel
                </Link>
              </div>
            </span>
          :
            <Link
              className="button"
              to={`/control/recipe/${recipe.id}/clone/`}
            >
                Clone
            </Link>
        }

        {viewingRevision &&
          <p id="viewing-revision" className="notification info">
            You are viewing a past version of this recipe. Saving this form
            will rollback the recipe to this revision.
          </p>
        }

        <FormField type="text" label="Name" field={name} containerClass="fluid-3" />
        <CheckboxField label="Enabled" field={enabled} containerClass="fluid-3" />
        <FormField
          type="textarea"
          label="Filter Expression"
          field={filterExpression}
          containerClass="fluid-3"
        />
        <FormField
          type="select"
          label="Action"
          field={action}
          containerClass="fluid-3"
          options={availableActions}
          onChange={this.changeAction}
        />

        {selectedAction && <ActionForm recipe={recipe} {...selectedAction} />}

        <div className="row form-action-buttons">
          <div className="fluid-2">
            {recipeId &&
              <Link className="button delete" to={`/control/recipe/${recipeId}/delete/`}>
                Delete
              </Link>
            }
          </div>
          <div className="fluid-2 float-right">
            <button
              className="button"
              type="submit"
              disabled={submitting}
            >
              {submitButtonCaption}
            </button>
          </div>
        </div>

      </form>
    );
  }
}

export default composeRecipeContainer(reduxForm({
  form: 'recipe',
}, (state, props) => {
  const fields = ['name', 'filter_expression', 'enabled', 'action'];
  const selectedRecipeRevision = (props.location.state)
    ? props.location.state.selectedRevision
    : null;

  const formatErrors = payload => {
    let errors = payload;

    /* If our payload is an object, process each error in the object
       Otherwise, it is a string and will be returned immediately */
    if (_.isObject(payload)) {
      const invalidFields = Object.keys(payload);
      if (invalidFields.length > 0) {
        /* If our error keys are integers, it means they correspond
           to an array field and we want to present errors as an array
           e.g. { surveys: {0: {title: 'err'}}, {2: {weight: 'err'}} }
           =>   { surveys: [{title: 'err'}, null, {weight: 'err'}] } */
        errors = isNaN(invalidFields[0]) ? {} : [];

        invalidFields.forEach(fieldName => {
          errors[fieldName] = formatErrors(payload[fieldName]);
        });
      }
    }

    return errors;
  };

  const onSubmitFail = errors => {
    const { dispatch } = props;
    const actionFormErrors = errors.arguments;

    if (actionFormErrors) {
      dispatch(stopSubmit('action', formatErrors(actionFormErrors)));
    }
  };

  return {
    fields,
    initialValues: selectedRecipeRevision || props.recipe,
    viewingRevision: selectedRecipeRevision || props.location.query.revisionId,
    formState: state.form,
    onSubmitFail,
  };
})(DisconnectedRecipeForm));
