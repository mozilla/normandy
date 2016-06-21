import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import ControlActions from '../actions/ControlActions.js'

export default function composeApprovalRequestContainer(Component) {

  class ApprovalRequestContainer extends React.Component {
    constructor(props) {
      super(props);
      this.getRecipeData = this.getRecipeData.bind(this);
      this.getApprovalRequestData = this.getApprovalRequestData.bind(this);
    }

    getRecipeData(recipeId) {
      const { dispatch, location, recipe } = this.props;
      if (!recipe) {
        dispatch(ControlActions.setSelectedRecipe(recipeId));

        if (location.query.revisionId) {
          dispatch(ControlActions.makeApiRequest('fetchSingleRevision', { revisionId: location.query.revisionId }));
        } else {
          dispatch(ControlActions.makeApiRequest('fetchSingleRecipe', { recipeId: recipeId }));
        }
      }
    }

    getApprovalRequestData(approvalRequestId) {
      const { dispatch, location, approvalRequest } = this.props;
      if (!approvalRequest) {
        dispatch(ControlActions.setSelectedApprovalRequest(approvalRequestId));
        dispatch(ControlActions.makeApiRequest('fetchSingleApprovalRequest', { approvalRequestId: approvalRequestId }));
      }
      dispatch(ControlActions.makeApiRequest('fetchAllApprovalRequestComments', { approvalRequestId: approvalRequestId }));
    }

    componentWillMount() {
      if (this.props.recipeId) {
        this.getRecipeData(this.props.recipeId);
      }
      if (this.props.approvalRequestId) {
        this.getApprovalRequestData(this.props.approvalRequestId);
      }
    }

    render() {
     return <Component {...this.props} {...this.state} />
    }
  }

  const mapStateToProps = (state, props) => {
    let recipeData = null;
    if (state.controlApp.recipes) {
      recipeData = state.controlApp.recipes.find(recipe => {
        return recipe.id === state.controlApp.selectedRecipe;
      });
    }

    let approvalRequestData = null;
    if (state.controlApp.approvalRequests) {
      approvalRequestData = state.controlApp.approvalRequests.find(approvalRequest => {
        return approvalRequest.id === state.controlApp.selectedApprovalRequest;
      });
    }

    return {
      recipeId: state.controlApp.selectedRecipe || parseInt(props.routeParams.recipeId) || null,
      approvalRequestId: state.controlApp.selectedApprovalRequest || parseInt(props.routeParams.approvalRequestId) || null,
      recipe: recipeData,
      approvalRequest: approvalRequestData,
      approvalRequestComments: state.controlApp.approvalRequestComments || [],
      dispatch: props.dispatch
    };
  };

  ApprovalRequestContainer.propTypes = {
    recipeId: React.PropTypes.number,
    approvalRequestId: React.PropTypes.number,
    recipe: React.PropTypes.object,
    approvalRequest: React.PropTypes.object,
    approvalRequestComments: React.PropTypes.array,
    dispatch: React.PropTypes.func
  };

  return connect(
    mapStateToProps
  )(ApprovalRequestContainer)

}
