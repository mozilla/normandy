import React, { PropTypes as pt } from 'react';

import { makeApiRequest } from 'control/actions/ControlActions';

import composeRecipeContainer from 'control/components/RecipeContainer';
import HistoryList from 'control/components/HistoryList';

export default class RecipeHistory extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipe: pt.object.isRequired,
    recipeId: pt.number.isRequired,
    isRecipeContainer: pt.bool,
  }

  constructor(props) {
    super(props);
    this.state = {
      revisions: [],
    };
  }

  componentDidMount() {
    const { recipeId } = this.props;
    this.getHistory(recipeId);
  }

  getHistory(recipeId) {
    const { dispatch } = this.props;

    dispatch(makeApiRequest('fetchRecipeHistory', { recipeId }))
    .then(history => {
      this.setState({
        revisions: history,
      });
    });
  }

  render() {
    const { recipe, isRecipeContainer, dispatch } = this.props;
    const { revisions } = this.state;

    return (
      <HistoryList
        recipe={recipe}
        dispatch={dispatch}
        revisions={revisions}
        isRecipeContainer={isRecipeContainer}
        direction={'asc'}
      />
    );
  }
}

export const RecipeHistoryPage = composeRecipeContainer(RecipeHistory);
