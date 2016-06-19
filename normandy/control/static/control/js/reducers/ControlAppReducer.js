import {
  REQUEST_IN_PROGRESS, REQUEST_COMPLETE,
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED,
  RECIPE_ADDED, RECIPE_UPDATED, RECIPE_DELETED,
  SET_SELECTED_RECIPE, APPROVAL_REQUESTS_RECEIVED,
  SINGLE_APPROVAL_REQUEST_RECEIVED, APPROVAL_REQUEST_CREATED,
  SET_SELECTED_APPROVAL_REQUEST, APPROVAL_REQUEST_COMMENTS_RECEIVED,
  APPROVAL_REQUEST_COMMENT_CREATED
} from '../actions/ControlActions.js';

let initialState = {
  recipes: null,
  approvalRequests: null,
  isFetching: false,
  selectedRecipe: null,
  selectedApprovalRequest: null,
  recipeListNeedsFetch: true,
  approvalRequestListNeedsFetch: true
};

function controlAppReducer(state = initialState, action) {
  switch (action.type) {

    case REQUEST_IN_PROGRESS:
      return Object.assign({}, state, {
        isFetching: true
      });

    case REQUEST_COMPLETE:
      return Object.assign({}, state, {
        isFetching: false
      });

    case RECIPES_RECEIVED:
      return Object.assign({}, state, {
        recipes: action.recipes,
        recipeListNeedsFetch: false
      });

    case SINGLE_RECIPE_RECEIVED:
      return Object.assign({}, state, {
        recipes: [action.recipe],
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id
      });

    case SET_SELECTED_RECIPE:
      return Object.assign({}, state, {
        selectedRecipe: action.recipeId,
        approvalRequestListNeedsFetch: true
      });

    case RECIPE_ADDED:
      return Object.assign({}, state, {
        recipes: [
          ...state.recipes || [],
          action.recipe
        ]
      });

    case RECIPE_UPDATED:
      return Object.assign({}, state, {
        recipes: state.recipes.map((recipe) => {
          if (recipe.id === action.recipe.id) {
            recipe = Object.assign(recipe, action.recipe);
          }
          return recipe;
        })
      });

    case RECIPE_DELETED:
      return Object.assign({}, state, {
        recipes: state.recipes.filter((recipe) => {
          return recipe.id !== action.recipeId;
        })
      });

    case APPROVAL_REQUESTS_RECEIVED:
      return Object.assign({}, state, {
        approvalRequests: action.approvalRequests,
        approvalRequestsListNeedsFetch: false
      });

    case SINGLE_APPROVAL_REQUEST_RECEIVED:
      return Object.assign({}, state, {
        approvalRequests: [action.approvalRequest],
        approvalRequestsListNeedsFetch: true,
        selectedRecipe: action.approvalRequest.id
      });

    case SET_SELECTED_APPROVAL_REQUEST:
      return Object.assign({}, state, {
        selectedApprovalRequest: action.approvalRequestId,
        approvalRequestComments: null
      });

    case APPROVAL_REQUEST_CREATED:
      return Object.assign({}, state, {
        approvalRequests: [
          ...state.approvalRequests || [],
          action.approvalRequest
        ]
      });

    case APPROVAL_REQUEST_COMMENTS_RECEIVED:
      return Object.assign({}, state, {
        approvalRequestComments: action.approvalRequestComments
      });

    case APPROVAL_REQUEST_COMMENT_CREATED:
      return Object.assign({}, state, {
        approvalRequestComments: [
          ...state.approvalRequestComments || [],
          action.approvalRequestComment
        ]
      });

    default:
      return state;
  }
}

export default controlAppReducer;
