import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { push } from 'react-router-redux'
import { destroy, reduxForm, getValues } from 'redux-form'
import jexl from 'jexl'

import { makeApiRequest, recipeUpdated, recipeAdded } from '../actions/ControlActions.js'
import composeRecipeContainer from './RecipeContainer.jsx'
import ActionForm from './ActionForm.jsx'
import CheckboxField from './form_fields/CheckboxField.jsx';
import FormField from './form_fields/FormFieldWrapper.jsx';

export class RecipeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      availableActions: ['console-log', 'show-heartbeat'],
      selectedAction: null,
    };
  }

  changeAction(event) {
    const { dispatch, fields } = this.props;
    let selectedActionName = event.target.value;

    dispatch(destroy('action'));
    fields.action.onChange(event);
    this.setState({
      selectedAction: { name: selectedActionName }
    });
  }

  validateForm(formValues) {
    let jexlExpression = formValues.filter_expression;
    return jexl.eval(jexlExpression, {});
  }

  submitForm() {
    const { dispatch, formState, recipeId } = this.props;

    let recipeFormValues = getValues(formState.recipe);
    let actionFormValues = getValues(formState.action);
    let combinedFormValues = { ...recipeFormValues, arguments: actionFormValues };
    let requestBody = { recipe: combinedFormValues, recipeId };

    return this.validateForm(combinedFormValues)
    .catch(error => {
      throw {
        filter_expression: "Invalid Expression"
      };
    })
    .then(response => {
      if (recipeId) {
        return dispatch(makeApiRequest('updateRecipe', requestBody))
        .then(response => dispatch(recipeUpdated(response)));
      } else {
        return dispatch(makeApiRequest('addRecipe', requestBody))
        .then(response => {
          dispatch(recipeAdded(response));
          dispatch(push(`/control/recipe/${response.id}/`));
        });
      };
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.selectedAction && nextProps.recipe) {
      let selectedActionName = nextProps.recipe.action;
      this.setState({
        selectedAction: { name: selectedActionName }
      });
    }
  }

  render() {
    const {
      fields: { name, filter_expression, enabled, action },
      submitting, recipe, recipeId, handleSubmit, viewingRevision
    } = this.props;
    const { availableActions, selectedAction } = this.state;

    return (
      <form onSubmit={handleSubmit(::this.submitForm)} className="crud-form fluid-8">

        { viewingRevision &&
          <p id="viewing-revision" className="notification info">
            You are viewing a past version of this recipe. Saving this form will rollback the recipe to this revision.
          </p>
        }

        <FormField type="text" label="Name" field={name} containerClass="fluid-3" />
        <CheckboxField label="Enabled" field={enabled} containerClass="fluid-3" />
        <FormField type="textarea" label="Filter Expression" field={filter_expression} containerClass="fluid-3" />
        <FormField type="select" label="Action" field={action} containerClass="fluid-3"
          options={availableActions}
          onChange={::this.changeAction}
        />

        { selectedAction && <ActionForm recipe={recipe} {...selectedAction} /> }

        <div className="row form-action-buttons">
          <div className="fluid-2">
            {recipeId ? <Link className="button delete" to={`/control/recipe/${recipeId}/delete/`}>Delete</Link> : ''}
          </div>
          <div className="fluid-2 float-right">
            <button className="button" type="submit" disabled={submitting} >Submit</button>
          </div>
        </div>

      </form>
    )
  }
}

RecipeForm.propTypes = {
  fields: React.PropTypes.object.isRequired,
}

export default composeRecipeContainer(reduxForm({
    form: 'recipe'
  }, (state, props) => {
    let fields = ['name', 'filter_expression', 'enabled', 'action'];
    let selectedRecipeRevision = null;
    let viewingRevision = false;

    if (props.location) {
      selectedRecipeRevision = props.location.state ? props.location.state.selectedRevision : null;
      viewingRevision = ((selectedRecipeRevision || props.location.query.revisionId) ? true : false)
    }

    return {
      fields,
      initialValues: selectedRecipeRevision || props.recipe,
      viewingRevision,
      formState: state.form
    }
})(RecipeForm));
