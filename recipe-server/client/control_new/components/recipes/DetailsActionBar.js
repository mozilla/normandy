import { Button } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import { getRecipe } from 'control_new/state/recipes/selectors';
import { isLatestApprovedRevision } from 'control_new/state/revisions/selectors';
import { getUrlParam, getUrlParamAsInt } from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getUrlParamAsInt(state, 'recipeId');
    const revisionId = getUrlParam(state, 'revisionId');

    return {
      isLatestApproved: isLatestApprovedRevision(state, revisionId),
      recipe: getRecipe(state, recipeId, new Map()),
      recipeId,
      revisionId,
    };
  },
)
export default class DetailsActionBar extends React.Component {
  static propTypes = {
    isLatestApproved: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    recipeId: PropTypes.number.isRequired,
    revisionId: PropTypes.string.isRequired,
  };

  render() {
    const { isLatestApproved, recipe, recipeId, revisionId } = this.props;

    let cloneUrl = `/recipes/${recipeId}`;
    if (revisionId) {
      cloneUrl += `/rev/${revisionId}`;
    }
    cloneUrl += '/clone';

    return (
      <div className="details-action-bar clearfix">
        <Link href={cloneUrl}>
          <Button icon="swap" type="primary">Clone</Button>
        </Link>

        {
          !revisionId &&
            <Link href={`/recipes/${recipeId}/edit`}>
              <Button icon="edit" type="primary">Edit</Button>
            </Link>
        }

        {
          isLatestApproved && recipe.get('enabled') &&
            <Button icon="close-circle" type="danger">Disable</Button>
        }
      </div>
    );
  }
}
