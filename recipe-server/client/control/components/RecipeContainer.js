import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import {
  makeApiRequest,
  singleRecipeReceived,
  singleRevisionReceived,
  setSelectedRecipe,
} from 'control/actions/ControlActions';

export default function composeRecipeContainer(Component) {
  class RecipeContainer extends React.Component {
    static propTypes = {
      dispatch: pt.func.isRequired,
      recipe: pt.object.isRequired,
      routeParams: pt.object.isRequired,
    }

    componentWillMount() {
      if (this.props.recipeId) {
        this.getRecipeData(this.props.recipeId);
      }
    }

    componentWillReceiveProps({ recipeId, routeParams = {} }) {
      const isRecipeChanging = recipeId !== this.props.recipeId;
      const isRouteRevisionChanging =
        routeParams.revisionId !== this.props.routeParams.revisionId;

      if (recipeId && isRecipeChanging) {
        this.getRecipeData(recipeId, routeParams && routeParams.revisionId);
      }
      if (routeParams.revisionId && isRouteRevisionChanging) {
        this.getRecipeRevision(routeParams.revisionId);
      }
    }

    getRecipeData(recipeId, revisionId) {
      const { dispatch, recipe, routeParams } = this.props;
      if (!recipe) {
        dispatch(setSelectedRecipe(recipeId));

        // always get the latest
        dispatch(makeApiRequest('fetchSingleRecipe', { recipeId }))
        .then(newRecipe => {
          dispatch(singleRecipeReceived(newRecipe));
          // get a specific revision, if specified
          if (revisionId || routeParams.revisionId) {
            this.getRecipeRevision(revisionId || routeParams.revisionId);
          }
        });
      }
    }

    getRecipeRevision(revisionId) {
      const { dispatch } = this.props;

      return dispatch(makeApiRequest('fetchSingleRevision', { revisionId }))
        .then(revision => {
          dispatch(singleRevisionReceived({ revision }));
        });
    }

    render() {
      return <Component {...this.props} {...this.state} />;
    }
  }

  const mapStateToProps = (state, props) => {
    let recipe = null;
    let revision = null;
    const selectedRecipeId = state.recipes && state.recipes.selectedRecipe;
    let selectedRevisionId = props.routeParams && props.routeParams.revisionId;

    const recipeRevisions = state.recipes.revisions[selectedRecipeId] || {};

    if (selectedRecipeId) {
      recipe = state.recipes.list
        .find(rec => rec.id === selectedRecipeId);

      // If there is a selected revision, attempt to pull that info.
      if (!selectedRevisionId) {
        // If there is _not_ a selected revision, default to the latest
        let latestId = -1;

        for (const revisionId in recipeRevisions) {
          if (recipeRevisions[revisionId].id > latestId) {
            latestId = recipeRevisions[revisionId].revision_id;
          }
        }
        selectedRevisionId = recipeRevisions[latestId] && recipeRevisions[latestId].revision_id;
      }

      revision = recipeRevisions[selectedRevisionId];

      if (!revision) {
        recipe = null;
      }
    }
    return {
      recipeId: state.recipes.selectedRecipe || parseInt(props.params.id, 10) || null,
      recipe,
      revision,
      dispatch: props.dispatch,
    };
  };

  RecipeContainer.propTypes = {
    recipeId: React.PropTypes.number,
    recipe: React.PropTypes.object,
    dispatch: React.PropTypes.func,
  };

  return connect(
    mapStateToProps
  )(RecipeContainer);
}
