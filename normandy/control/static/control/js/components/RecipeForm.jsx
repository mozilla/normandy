import React, { PropTypes as pt } from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { destroy, reduxForm, getValues } from 'redux-form';
import jexl from 'jexl';

import { makeApiRequest, recipeUpdated, recipeAdded } from '../actions/ControlActions.js';
import composeRecipeContainer from './RecipeContainer.jsx';
import ActionForm from './ActionForm.jsx';
import CheckboxField from './form_fields/CheckboxField.jsx';
import FormField from './form_fields/FormFieldWrapper.jsx';

export class RecipeForm extends React.Component {
  propTypes = {
    dispatch: pt.func.isRequired,
    formState: pt.object.isRequired,
    recipeId: pt.number.isRequired,
    submitting: pt.bool.isRequired,
    recipe: pt.object.isRequired,
    handleSubmit: pt.func.isRequired,
    viewingRevision: pt.bool.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      availableActions: ['console-log', 'show-heartbeat'],
      selectedAction: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.selectedAction && nextProps.recipe) {
      const selectedActionName = nextProps.recipe.action;
      this.setState({
        selectedAction: { name: selectedActionName },
      });
    }
  }

  changeAction(event) {
    const { dispatch, fields } = this.props;
    const selectedActionName = event.currentTarget.value;

    dispatch(destroy('action'));
    fields.action.onChange(event);
    this.setState({
      selectedAction: { name: selectedActionName },
    });
  }

  validateForm(formValues) {
    const jexlExpression = formValues.filter_expression;
    return jexl.eval(jexlExpression, {});
  }

  submitForm() {
    const { dispatch, formState, recipeId } = this.props;

    const recipeFormValues = getValues(formState.recipe);
    const actionFormValues = getValues(formState.action);
    const combinedFormValues = { ...recipeFormValues, arguments: actionFormValues };
    const requestBody = { recipe: combinedFormValues, recipeId };

    return this.validateForm(combinedFormValues)
    .catch(() => {
      throw {
        filter_expression: 'Invalid Expression',
      };
    })
    .then(() => {
      if (recipeId) {
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

    return (
      <form onSubmit={handleSubmit(::this.submitForm)} className="crud-form fluid-8">

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
          onChange={::this.changeAction}
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
            <button className="button" type="submit" disabled={submitting} >Submit</button>
          </div>
        </div>

      </form>
    );
  }
}
RecipeForm.propTypes = {
  fields: React.PropTypes.object.isRequired,
};

export default composeRecipeContainer(reduxForm({
  form: 'recipe',
}, (state, props) => {
  const fields = ['name', 'filter_expression', 'enabled', 'action'];
  const selectedRecipeRevision = (props.location.state)
    ? props.location.state.selectedRevision
    : null;

  return {
    fields,
    initialValues: selectedRecipeRevision || props.recipe,
    viewingRevision: selectedRecipeRevision || props.location.query.revisionId,
    formState: state.form,
  };
})(RecipeForm));
