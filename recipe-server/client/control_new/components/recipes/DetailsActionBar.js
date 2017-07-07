import { Button } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import {
  getLatestRevisionIdForRecipe,
  getRecipe,
} from 'control_new/state/recipes/selectors';
import {
  isLatestApprovedRevision,
  isLatestRevision,
} from 'control_new/state/revisions/selectors';
import {
  getUrlParam,
  getUrlParamAsInt,
} from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getUrlParamAsInt(state, 'recipeId');
    const latestRevisionId = getLatestRevisionIdForRecipe(state, recipeId, '');
    const recipe = getRecipe(state, recipeId, new Map());
    const revisionId = getUrlParam(state, 'revisionId', latestRevisionId);

    return {
      isLatest: isLatestRevision(state, revisionId),
      isLatestApproved: isLatestApprovedRevision(state, revisionId),
      recipe,
      recipeId,
      revisionId,
    };
  },
)
export default class DetailsActionBar extends React.Component {
  static propTypes = {
    isLatest: PropTypes.bool.isRequired,
    isLatestApproved: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    recipeId: PropTypes.number.isRequired,
    revisionId: PropTypes.string.isRequired,
  };

  render() {
    const { isLatest, isLatestApproved, recipe, recipeId, revisionId } = this.props;

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
          isLatest &&
            <Link href={`/recipes/${recipeId}/edit`}>
              <Button icon="edit" type="primary">Edit</Button>
            </Link>
        }

        {
          isLatestApproved && recipe.get('enabled') &&
            <Button icon="close-circle" type="danger">Disable</Button>
        }

        {
          isLatestApproved && !recipe.get('enabled') &&
            <Button icon="check-circle" type="primary">Publish</Button>
        }
      </div>
    );
  }
}
