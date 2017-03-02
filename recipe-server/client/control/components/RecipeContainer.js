import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import {
  makeApiRequest,
  singleRecipeReceived,
  setSelectedRecipe,
  setSelectedRevision,
  revisionsReceived,
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
        this.getRecipeData(this.props.recipeId, this.props.routeParams.revisionId);
      }
    }

    componentWillReceiveProps({ recipeId, routeParams = {} }) {
      const isRecipeChanging = recipeId !== this.props.recipeId;
      const isRouteRevisionChanging =
        routeParams.revisionId !== this.props.routeParams.revisionId;

      if (isRecipeChanging) {
        this.getRecipeData(recipeId, routeParams && routeParams.revisionId);
      }

      if (isRouteRevisionChanging) {
        this.props.dispatch(setSelectedRevision(routeParams.revisionId));
      }
    }

    getRecipeData(recipeId, revisionId) {
      const { dispatch } = this.props;
      if (!recipeId) {
        return;
      }

      dispatch(setSelectedRecipe(recipeId));
      dispatch(setSelectedRevision(revisionId));

      dispatch(makeApiRequest('fetchSingleRecipe', { recipeId }))
        .then(newRecipe => {
          dispatch(singleRecipeReceived(newRecipe));

          this.getRecipeHistory(recipeId, revisionId);
        });
    }

    getRecipeHistory(recipeId, revisionId) {
      const { dispatch } = this.props;

      dispatch(makeApiRequest('fetchRecipeHistory', { recipeId }))
        .then(revisions => {
          dispatch(setSelectedRevision(revisionId || revisions[0].id));

          dispatch(revisionsReceived({
            recipeId,
            revisions,
          }));
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
    let selectedRevisionId = state.recipes && state.recipes.selectedRevision;

    const recipeRevisions = state.recipes.revisions[selectedRecipeId] || {};


    if (selectedRecipeId) {
      recipe = state.recipes.list
        .find(rec => rec.id === selectedRecipeId);

      let latestId = -1;
      let latestTime;
      // If there is a selected revision, attempt to pull that info.
      if (!selectedRevisionId) {
        // If there is _not_ a selected revision, default to the latest

        for (const revisionId in recipeRevisions) {
          if (recipeRevisions.hasOwnProperty(revisionId)) {
            const sinceRevision = moment().diff(recipeRevisions[revisionId].date_created);
            if (!selectedRevisionId || sinceRevision < latestTime) {
              latestId = revisionId;
              latestTime = sinceRevision;
            }
          }
        }
        selectedRevisionId = latestId;
      }

      revision = (recipeRevisions[selectedRevisionId] || {}).recipe;

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
