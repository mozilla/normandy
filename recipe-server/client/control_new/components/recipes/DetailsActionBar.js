import { Button, Modal } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import * as recipeActions from 'control_new/state/recipes/actions';
import * as revisionActions from 'control_new/state/revisions/actions';
import {
  getLatestRevisionIdForRecipe,
  getRecipe,
} from 'control_new/state/recipes/selectors';
import {
  isApprovableRevision,
  isLatestApprovedRevision,
  isLatestRevision,
  isRevisionPendingApproval,
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
      isPendingApproval: isRevisionPendingApproval(state, revisionId),
      isApprovable: isApprovableRevision(state, revisionId),
      recipe,
      recipeId,
      revisionId,
    };
  },
  {
    disableRecipe: recipeActions.disableRecipe,
    enableRecipe: recipeActions.enableRecipe,
    requestRevisionApproval: revisionActions.requestRevisionApproval,
  },
)
@autobind
export default class DetailsActionBar extends React.Component {
  static propTypes = {
    disableRecipe: PropTypes.func.isRequired,
    enableRecipe: PropTypes.func.isRequired,
    isApprovable: PropTypes.bool.isRequired,
    isLatest: PropTypes.bool.isRequired,
    isLatestApproved: PropTypes.bool.isRequired,
    isPendingApproval: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    recipeId: PropTypes.number.isRequired,
    requestRevisionApproval: PropTypes.func.isRequired,
    revisionId: PropTypes.string.isRequired,
  };

  handleDisableClick() {
    const { disableRecipe, recipeId } = this.props;
    Modal.confirm({
      title: 'Are you sure you want to disable this recipe?',
      onOk() {
        disableRecipe(recipeId);
      },
    });
  }

  handlePublishClick() {
    const { enableRecipe, recipeId } = this.props;
    Modal.confirm({
      title: 'Are you sure you want to publish this recipe?',
      onOk() {
        enableRecipe(recipeId);
      },
    });
  }

  handleRequestClick() {
    const { requestRevisionApproval, revisionId } = this.props;
    requestRevisionApproval(revisionId);
  }

  render() {
    const {
      isApprovable,
      isLatest,
      isLatestApproved,
      isPendingApproval,
      recipe,
      recipeId,
      revisionId,
    } = this.props;

    let cloneUrl = `/recipe/${recipeId}`;
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
            <Link href={`/recipe/${recipeId}/edit`}>
              <Button icon="edit" type="primary">Edit</Button>
            </Link>
        }

        {
          isApprovable &&
            <Button icon="question-circle" type="primary" onClick={this.handleRequestClick}>
              Request Approval
            </Button>
        }

        {
          isPendingApproval &&
            <Link href={`/recipe/${recipeId}/approval_history`}>
              <Button icon="message" type="primary">Approval Request</Button>
            </Link>
        }

        {
          isLatestApproved && recipe.get('enabled') &&
            <Button icon="close-circle" type="danger" onClick={this.handleDisableClick}>
              Disable
            </Button>
        }

        {
          isLatestApproved && !recipe.get('enabled') &&
            <Button icon="check-circle" type="primary" onClick={this.handlePublishClick}>
              Publish
            </Button>
        }
      </div>
    );
  }
}
