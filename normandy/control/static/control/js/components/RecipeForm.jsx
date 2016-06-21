import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { push } from 'react-router-redux'
import { destroy, reduxForm, getValues } from 'redux-form'
import jexl from 'jexl'

import apiFetch from '../utils/apiFetch.js';
import ControlActions from '../actions/ControlActions.js'
import composeRecipeContainer from './RecipeContainer.jsx'
import ActionForm from './ActionForm.jsx'
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
    let selectedActionName = event.currentTarget.value;

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
    return this.validateForm(combinedFormValues)
    .catch(error => {
      throw {
        filter_expression: "Invalid Expression"
      };
    })
    .then(response => {
      if (recipeId) {
        dispatch(ControlActions.makeApiRequest('updateRecipe', {
          recipe: combinedFormValues,
          recipeId: recipeId
        }));
      } else {
        dispatch(ControlActions.makeApiRequest('addRecipe', combinedFormValues));
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.selectedAction && nextProps.recipe) {
      let selectedActionName = nextProps.recipe.action;
      this.setState({
        selectedAction: { name: selectedActionName }
      });
    }
  }

  createApprovalRequest() {
    if (this.props.recipeId) {
      this.props.dispatch(ControlActions.makeApiRequest('createApprovalRequest', { recipeId: this.props.recipeId }));
    }
  }

  render() {
    const { fields: { name, filter_expression, enabled, action }, recipe, recipeId, handleSubmit, viewingRevision } = this.props;
    const { availableActions, selectedAction } = this.state;

    return (
      <form onSubmit={handleSubmit(::this.submitForm)} className="crud-form">

        { viewingRevision &&
          <p id="viewing-revision" className="notification info">
            You are viewing a past version of this recipe. Saving this form will rollback the recipe to this revision.
          </p>
        }

        { recipeId ?
          <div id="status-details" className="fluid-3 float-right">
            <div className={ enabled.checked ? 'recipe-enabled' : 'recipe-disabled' }>
              <label>Recipe Status</label>

              <p className="status-with-icon">
              <span onClick={() => enabled.onChange(false)}
                    className="toggle-recipe-status disabled"><i
                  className="pre fa fa-lg fa-times red"></i> Disabled</span>
                <span className="separator">&nbsp;</span>
              <span onClick={() => enabled.onChange(true)}
                    className="toggle-recipe-status enabled"><i
                  className="pre fa fa-lg fa-check green"></i> Enabled</span>
              </p>
            </div>
            <div>
              <label>Approval Status</label>
              <div>
                {(() => {
                  if (recipe) {
                    switch (recipe.approval) {
                      case null:
                        if (recipe.current_approval_request) {
                          return <p className="status-with-icon"><i className="fa fa-lg fa-question-circle yellow">&nbsp;</i> Pending</p>;
                        } else {
                          return <p className="status-with-icon"><i className="fa fa-lg fa-times red">&nbsp;</i> Not Approved</p>;
                        }
                      default:
                        return <p className="status-with-icon"><i className="fa fa-lg fa-check green">&nbsp;</i> Approved</p>;
                    }
                  }
                })()}

                {(() => {
                  if (recipe) {
                    switch (recipe.approval) {
                      case null:
                        if (recipe.current_approval_request) {
                          return <div><a className="button" onClick={() => {this.props.dispatch(push(`/control/recipe/${recipe.id}/requests/${recipe.current_approval_request.id}/`))}}>View Conversation</a></div>;
                        } else {
                          return <div><a className="button" onClick={::this.createApprovalRequest}>Request Approval</a></div>;
                        }
                      default:
                        return '';
                    }
                  }
                })()}
              </div>
            </div>
          </div> : ''
        }

        <FormField type="text" label="Name" field={name} containerClass="fluid-3" />
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
            <button className="button" type="submit">Submit</button>
          </div>
        </div>

      </form>
    )
  }
}

RecipeForm.propTypes = {
  fields: React.PropTypes.object.isRequired,
};

export default composeRecipeContainer(reduxForm({
    form: 'recipe'
  }, (state, props) => {
    let fields = ['name', 'filter_expression', 'enabled', 'action'];
    let selectedRecipeRevision = (props.location.state) ? props.location.state.selectedRevision : null;

    return {
      fields,
      initialValues: selectedRecipeRevision || props.recipe,
      viewingRevision: ((selectedRecipeRevision || props.location.query.revisionId) ? true : false),
      formState: state.form
    }
})(RecipeForm))
