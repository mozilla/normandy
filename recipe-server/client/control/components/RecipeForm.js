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
import cx from 'classnames';

import {
  makeApiRequest,
  recipeUpdated,
  recipeAdded,
  showNotification,
  setSelectedRecipe,
  singleRecipeReceived,
} from 'control/actions/ControlActions';

import {
  getRecipeApprovalRequest,
} from 'control/selectors/RecipesSelector';

import composeRecipeContainer from 'control/components/RecipeContainer';
import DraftStatus from 'control/components/DraftStatus';
import DraftComment from 'control/components/DraftComment';
import { ControlField } from 'control/components/Fields';
import RecipeHistory from 'control/components/RecipeHistory';
import HeartbeatFields from 'control/components/action_fields/HeartbeatFields';
import ConsoleLogFields from 'control/components/action_fields/ConsoleLogFields';
import JexlEnvironment from 'selfrepair/JexlEnvironment';
import DropdownMenu from 'control/components/DropdownMenu';


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
    recipeFields: pt.object,
    // route prop passed from router
    route: pt.object,
    routeParams: pt.object,
    dispatch: pt.func.isRequired,
    recipeEntries: pt.object.isRequired,
    updateRecipe: pt.func.isRequired,
    // pristine is from redux-form
    pristine: pt.bool.isRequired,
  };

  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': HeartbeatFields,
  };

  static loadingElement = (
    <div className="recipe-form loading">
      <i className="fa fa-spinner fa-spin fa-3x fa-fw" />
      <p>Loading recipe...</p>
    </div>
  );

  constructor(props) {
    super(props);

    this.formActionRevert = ::this.formActionRevert;
    this.formActionApprove = ::this.formActionApprove;
    this.formActionReject = ::this.formActionReject;
    this.formActionRequestReview = ::this.formActionRequestReview;
    this.formActionCloseReview = ::this.formActionCloseReview;

    this.commentArea = {};

    this.state = {
      comment: {},
    };
  }

  getOutdatedStatus() {
    const {
      routeParams,
    } = this.props;

    return !!routeParams.revisionId;
  }


  createFormButton(args) {
    this.buttonCache = this.buttonCache || {};
    const key = JSON.stringify(args);
    // check cache key, generate button if necessary
    if (!this.buttonCache[key]) {
      const {
        className,
        label,
        Element = 'button',
        type = 'button',
        ...props,
      } = args;

      this.buttonCache[key] = (
        <Element
          className={cx('button', className)}
          onClick={props.onClick}
          children={label}
          type={type}
          key={label + className}
          {...props}
        />
      );
    }
    // return the (now) cached button
    return this.buttonCache[key];
  }

  formActionRevert() {
    const {
      recipeId,
      recipe,
    } = this.props;

    this.props.updateRecipe(recipeId, recipe);
  }

  formActionApprove() {
    const {
      recipe,
    } = this.props;

    if (!recipe || !recipe.approval_request) {
      // Throw an error, since this shouldn't ever happen.
      throw new Error('Recipe and/or approval request doesn\'t exist for approval.');
    }

    this.props.dispatch(makeApiRequest('acceptApprovalRequest', {
      requestId: recipe.approval_request.id,
      comment: this.state.comment.accept,
    }));
  }

  formActionReject() {
    const {
      recipe,
    } = this.props;

    if (!recipe || !recipe.approval_request) {
      // Throw an error, since this shouldn't ever happen.
      throw new Error('Recipe and/or approval request doesn\'t exist for rejection.');
    }

    this.props.dispatch(makeApiRequest('rejectApprovalRequest', {
      requestId: recipe.approval_request.id,
      comment: this.state.comment.reject,
    }));
  }

  formActionRequestReview() {
    const {
      routeParams,
      dispatch,
      recipe,
    } = this.props;

    let revisionId = routeParams && routeParams.revisionId;
    if (!revisionId) {
      revisionId = recipe.revision_id;
    }

    dispatch(makeApiRequest('openApprovalRequest', {
      revisionId,
    }))
      .then(response => {
        dispatch(showNotification({
          messageType: 'success',
          message: 'Approval review requested!',
        }));
        dispatch(singleRecipeReceived({
          ...recipe,
          approval_request: { ...response },
        }));
      });
  }

  formActionCloseReview() {
    const {
      recipe,
      dispatch,
    } = this.props;

    dispatch(makeApiRequest('closeApprovalRequest', {
      requestId: recipe.approval_request.id,
    }))
      .then(() => {
        dispatch(showNotification({
          messageType: 'success',
          message: 'Approval review closed.',
        }));
        dispatch(singleRecipeReceived({
          ...recipe,
          approval_request: null,
        }));
      });
  }

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

  renderFormActionButtons({ disabled }) {
    const {
      route,
      recipe,
      recipeId,
      pristine,
    } = this.props;

    const revertButton = this.createFormButton({
      disabled,
      className: 'submit',
      onClick: this.formActionRevert,
      label: 'Revert to this Revision',
    });

    const cancelButton = this.createFormButton({
      className: 'submit delete',
      onClick: this.formActionCloseReview,
      label: 'Cancel Review Request',
    });

    const onCommentChange = type =>
      evt => {
        this.setState({
          comment: {
            ...this.state.comment,
            [type]: evt.target.value,
          },
        });
      };

    const approveButton = (
      <DropdownMenu
        pinRight
        useClick
        trigger={this.createFormButton({
          className: 'submit',
          label: 'Approve',
        })}
      >
        <div>
          Approval comment section
          <textarea
            defaultValue={this.state.comment.approve}
            onChange={onCommentChange('approve')}
          />
          <button
            type="button"
            onClick={this.formActionApprove}
            disabled={!this.state.comment.approve}
          >
            Approve
          </button>
        </div>
      </DropdownMenu>
    );

    const rejectButton = (
      <DropdownMenu
        pinRight
        useClick
        trigger={this.createFormButton({
          className: 'submit',
          label: 'Reject',
        })}
      >
        <div>
          Reject comment section
          <textarea
            defaultValue={this.state.comment.reject}
            onChange={onCommentChange('reject')}
          />
          <button
            type="button"
            onClick={this.formActionReject}
            disabled={!this.state.comment.reject}
          >
            Reject
          </button>
        </div>
      </DropdownMenu>
    );

    const deleteButton = this.createFormButton({
      disabled,
      Element: Link,
      className: 'delete',
      to: `/control/recipe/${recipeId}/delete/`,
      label: 'Delete',
    });

    const requestButton = this.createFormButton({
      disabled,
      className: 'submit',
      onClick: this.formActionRequestReview,
      label: 'Request Review',
    });

    const saveRevisionButton = this.createFormButton({
      disabled,
      className: 'submit',
      label: 'Save Revision',
      type: 'submit',
    });

    const newButton = this.createFormButton({
      disabled,
      className: 'submit',
      label: 'Create New Recipe',
      type: 'submit',
    });


    const isCloning = route && route.isCloning;
    const isPristine = pristine;

    const isViewingOutdated = this.getOutdatedStatus();
    const isPendingApproval = !!getRecipeApprovalRequest(recipe);

    const requestDetails = recipe && recipe.approval_request;
    const currentUserID = requestDetails && requestDetails.creator.id;
    const approvalRequestor = requestDetails && requestDetails.creator.id;

    // revert button -  if viewing an outdated draft
    const showRevertButton = isViewingOutdated;
    // cancel button - if under approval and this user is that requested
    const showCancelButton = !isViewingOutdated && isPendingApproval
      && currentUserID === approvalRequestor;
      // approve/reject if under approval and NOT the user that requested
    const showAppRejButtons = isPendingApproval && currentUserID !== approvalRequestor;
    // delete button - not viewing old, not under approval, is existing recipe,
    // and user isn't cloning
    const showDeleteButton = !isViewingOutdated && !isPendingApproval && recipeId && !isCloning;
    // not viewing old, not already under approval, exists, not cloning, form has not been touched
    const showRequestButton = !isViewingOutdated && !isPendingApproval && recipeId
      && !isCloning && isPristine;
    // not under approval, exists, not cloning, form HAS been touched - show 'save draft' button
    const showSaveButton = !isPendingApproval && recipeId && !isCloning && !isPristine;
    // not under approval, and is a new recipe - show 'save new' button
    const showNewButton = !isPendingApproval && !recipeId;

    const buttons = [
      showRevertButton && revertButton,
      showCancelButton && cancelButton,
      showAppRejButtons && approveButton,
      showAppRejButtons && rejectButton,
      showDeleteButton && deleteButton,
      showRequestButton && requestButton,
      showSaveButton && saveRevisionButton,
      showNewButton && newButton,
    ].filter(x => x);

    return (
      <div className="form-actions">
        { buttons.map(el => el) }
      </div>
    );
  }

  render() {
    const {
      handleSubmit,
      selectedAction,
      submitting,
      recipe,
      recipeId,
      recipeFields,
      route,
    } = this.props;
    const noop = () => null;
    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction] || noop;

    // Show a loading indicator if we haven't yet loaded the recipe.
    if (recipeId && !recipe) {
      return RecipeForm.loadingElement;
    }

    const isCloning = route && route.isCloning;

    const isViewingOutdated = this.getOutdatedStatus();
    const request = getRecipeApprovalRequest(recipe);
    const isPendingApproval = !!request;

    const hasDisabledFields = submitting || isViewingOutdated || isPendingApproval;
    return (
      <form
        className="recipe-form"
        onSubmit={handleSubmit}
      >
        { this.renderCloningMessage() }

        {
          recipe && !isCloning &&
            <div className="draft-history">
              <DraftStatus
                recipe={recipe}
              />
              <RecipeHistory
                dispatch={this.props.dispatch}
                recipe={recipe}
                recipeId={recipeId}
              />
            </div>
        }

        <ControlField
          disabled={hasDisabledFields}
          label="Name"
          name="name"
          component="input" type="text"
        />
        <ControlField
          disabled={hasDisabledFields}
          label="Enabled"
          name="enabled"
          className="checkbox-field"
          component="input"
          type="checkbox"
        />
        <ControlField
          disabled={hasDisabledFields}
          label="Filter Expression"
          name="filter_expression"
          component="textarea"
        />
        <ControlField
          disabled={hasDisabledFields}
          label="Action"
          name="action"
          component="select"
        >
          <option value="">Choose an action...</option>
          <option value="console-log">Log to Console</option>
          <option value="show-heartbeat">Heartbeat Prompt</option>
        </ControlField>
        <ArgumentsFields fields={recipeFields} disabled={hasDisabledFields} />
        <DraftComment request={request} />
        {
          this.renderFormActionButtons({
            disabled: submitting || isViewingOutdated || isPendingApproval,
          })
        }
      </form>
    );
  }
}

/**
 * Redux-Form config for the RecipeForm.
 */
export const formConfig = {
  asyncBlurFields: ['extra_filter_expression'],
  enableReinitialize: true,
  form: 'recipe',

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
    recipeFields: selector(state, 'arguments'),
    recipeEntries: state.recipes.entries,
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
    dispatch,
  }),
);

// Use reduce to call several wrapper functions in a row.
export default [
  reduxForm(formConfig),
  connector,
  initialValuesWrapper,
  composeRecipeContainer,
].reduce((prev, func) => func(prev), RecipeForm);
