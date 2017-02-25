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
  singleRecipeReceived,
  userInfoReceived,
} from 'control/actions/ControlActions';
import composeRecipeContainer from 'control/components/RecipeContainer';
import { ControlField } from 'control/components/Fields';
import RecipeFormActions from 'control/components/RecipeFormActions';
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
    recipeFields: pt.object,
    user: pt.object,
    dispatch: pt.func.isRequired,
    // route props passed from router
    route: pt.object,
    routeParams: pt.object.isRequired,
    // from redux-form
    pristine: pt.bool,
  };

  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': HeartbeatFields,
  };

  static LoadingSpinner = (
    <div className="recipe-form loading">
      <i className="fa fa-spinner fa-spin fa-3x fa-fw" />
      <p>Loading recipe...</p>
    </div>
  );

  static renderCloningMessage({ route, recipe }) {
    const isCloning = route && route.isCloning;
    if (!isCloning || !recipe) {
      return null;
    }

    return (
      <span className="cloning-message callout">
        {'You are cloning '}
        <Link to={`/control/recipe/${recipe.id}/`}>
          {recipe.name} ({recipe.action})
        </Link>.
      </span>
    );
  }

  constructor(props) {
    super(props);

    this.handleFormAction = ::this.handleFormAction;
  }

  componentWillMount() {
    const {
      user,
      dispatch,
    } = this.props;

    if (!user.id) {
      dispatch(makeApiRequest('getCurrentUser'))
        .then(receivedUser => dispatch(userInfoReceived(receivedUser)));
    }
  }

  /**
   * Generates an object relevant to the user/draft state. All values returned
   * are cast as booleans.
   *
   * @return {Object} Hash of user/draft state data, formatted as booleans
   */
  getRenderVariables() {
    const {
      route,
      routeParams,
      recipe,
      pristine,
      submitting,
      recipeId,
      user: {
        id: userId,
      },
    } = this.props;
    const requestDetails = recipe && recipe.approval_request;
    const currentUserID = userId;
    const requestAuthorID = requestDetails && requestDetails.creator.id;

    const isUserViewingOutdated = !!(routeParams && routeParams.revisionId);
    const isPendingApproval = !!(requestDetails && !requestDetails.approved);
    const isFormDisabled = submitting || (isPendingApproval && !isUserViewingOutdated);

    return {
      isCloning: !!(route && route.isCloning),
      isUserRequestor: requestAuthorID === currentUserID,
      isAlreadySaved: !!recipeId,
      isFormPristine: pristine,
      isUserViewingOutdated,
      isPendingApproval,
      isFormDisabled,
    };
  }

  /**
   * Event handler for form action buttons.
   * Form action buttons remotely fire this handler with a (string) action type,
   * which then triggers the appropriate API requests/etc.
   *
   * @param  {string} action Action type to trigger. ex: 'close', 'approve', 'reject'
   */
  handleFormAction(action) {
    const {
      recipe,
      dispatch,
    } = this.props;

    switch (action) {
      case 'close': {
        dispatch(makeApiRequest('closeApprovalRequest', {
          requestId: recipe.approval_request.id,
        })).then(() => {
          // show success
          dispatch(showNotification({
            messageType: 'success',
            message: 'Approval review closed.',
          }));
          // remove approval request from recipe in memory
          dispatch(singleRecipeReceived({
            ...recipe,
            approval_request: null,
          }));
        });
        break;
      }
      case 'approve': {
        dispatch(makeApiRequest('acceptApprovalRequest', {
          requestId: recipe.approval_request.id,
        }));
        break;
      }
      case 'reject': {
        dispatch(makeApiRequest('rejectApprovalRequest', {
          requestId: recipe.approval_request.id,
        }));
        break;
      }
      case 'request': {
        dispatch(makeApiRequest('openApprovalRequest', {
          revisionId: recipe.revision_id,
        }))
        .then(response => {
          // show success message
          dispatch(showNotification({
            messageType: 'success',
            message: 'Approval review requested!',
          }));
          // patch existing recipe with new approval_request
          dispatch(singleRecipeReceived({
            ...recipe,
            approval_request: {
              ...response,
            },
          }));
        });
        break;
      }
      default: {
        throw new Error(`Unrecognized form action "${action}"`);
      }
    }
  }

  render() {
    const {
      handleSubmit,
      selectedAction,
      recipe,
      recipeId,
      recipeFields,
    } = this.props;
    const noop = () => null;
    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction] || noop;

    // Show a loading indicator if we haven't yet loaded the recipe.
    if (recipeId && !recipe) {
      return RecipeForm.LoadingSpinner;
    }

    const renderVars = this.getRenderVariables();
    const { isFormDisabled } = renderVars;

    return (
      <form className="recipe-form" onSubmit={handleSubmit}>
        { RecipeForm.renderCloningMessage(this.props) }

        <ControlField
          disabled={isFormDisabled}
          label="Name"
          name="name"
          component="input"
          type="text"
        />
        <ControlField
          disabled={isFormDisabled}
          label="Enabled"
          name="enabled"
          className="checkbox-field"
          component="input"
          type="checkbox"
        />
        <ControlField
          disabled={isFormDisabled}
          label="Filter Expression"
          name="filter_expression"
          component="textarea"
        />
        <ControlField
          disabled={isFormDisabled}
          label="Action"
          name="action"
          component="select"
        >
          <option value="">Choose an action...</option>
          <option value="console-log">Log to Console</option>
          <option value="show-heartbeat">Heartbeat Prompt</option>
        </ControlField>

        <ArgumentsFields disabled={isFormDisabled} fields={recipeFields} />

        <RecipeFormActions
          onAction={this.handleFormAction}
          recipeId={recipeId}
          {...renderVars}
        />
      </form>
    );
  }
}

/**
 * Redux-Form config for the RecipeForm.
 */
export const formConfig = {
  form: 'recipe',
  enableReinitialize: true,
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
    recipeFields: selector(state, 'arguments'),
    user: state.user,
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
