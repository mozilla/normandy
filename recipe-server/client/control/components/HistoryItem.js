import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';
import _string from 'underscore.string';
import moment from 'moment';
import cx from 'classnames';
import { diff } from 'deep-diff';

import { getRecipeApprovalRequest } from 'control/selectors/RecipesSelector';

import DraftStatusIcon from 'control/components/DraftStatusIcon';

const RECIPE_SHAPE = pt.shape({
  revision_id: pt.string.isRequired,
});

const REVISION_SHAPE = pt.shape({
  recipe: RECIPE_SHAPE.isRequired,
  date_created: pt.string.isRequired,
  comment: pt.string.isRequired,
});

export default class HistoryItem extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    revision: REVISION_SHAPE.isRequired,
    recipe: RECIPE_SHAPE.isRequired,
    el: pt.string.isRequired,
    forceShow: pt.bool,
    hideActiveStatus: pt.bool,
    disableClickHandler: pt.bool,
    previous: REVISION_SHAPE,
    direction: pt.oneOf(['asc', 'desc']),
    revisionId: pt.string,
  };

  static formatChangeLabel(value) {
    const camelCaseRegex = /([A-Z]+[a-z]*)|([a-z]+)|(\d+)/g;

    let labelValue = _string(value)
      // _'s become spaces
      .replaceAll('_', ' ')
      // .'s become >'s
      .replaceAll(/\./, ' > ')
      // Get the raw text value, since we need to do some non-underscore.string manipulation
      .value()
      // Infer where spaces in the label should be based on the camelCase'd property name
      .split(camelCaseRegex)
      // remove empty array entries
      .filter(x => x)
      .join(' ');

    labelValue = _string(labelValue)
      // Ensure Text Looks Like This
      .titleize()
      // return the string value
      .value();

    return labelValue;
  }

  static generateDiffItem({ path, lhs, rhs, kind }, index) {
    const iconClass = cx(
      'fa',
      // Edited
      kind === 'E' && 'fa-pencil-square-o',
      kind === 'A' && 'fa-pencil-square-o',
      // New field
      kind === 'N' && 'fa-plus-square-o',
      // Deleted field
      kind === 'D' && 'fa-minus-square-o',
    );

    const fromValue = kind === 'E' ? lhs : rhs;
    const toValue = rhs;

    let itemClass;
    switch (kind) {
      case 'E':
      case 'A':
        itemClass = 'edit';
        break;
      case 'N':
        itemClass = 'new';
        break;
      case 'D':
        itemClass = 'delete';
        break;
      default:
        itemClass = '';
        break;
    }

    return (
      <li className={itemClass} key={index}>
        <div className="change-label">
          <i className={iconClass} aria-hidden="true" />
          { HistoryItem.formatChangeLabel(path.join('.')) }:
        </div>
        <div className="change-values">
          <span className="change-from">{fromValue}</span>
          {
            kind === 'E' &&
              <span>
                {' → '}
                <span className="change-to">{toValue}</span>
              </span>
          }
        </div>
      </li>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      showInfo: !!props.forceShow,
    };
    this.handleClick = ::this.handleClick;
  }

  getDisplayedDiffs(difference) {
    const dontDisplay = [
      'last_updated',
      'revision_id',
      'extra_filter_expression',
      'latest_revision_id',
      'approval_request',
    ];

    return [].concat(difference)
      .map(update => {
        const path = update.path.join('.');
        return dontDisplay.indexOf(path) > -1 ? null : { ...update };
      })
      .filter(x => x);
  }

  /**
   * When a revision is clicked, open the recipe form with changes from
   * the clicked revision.
   */
  handleClick() {
    const {
      dispatch,
      revision,
      recipe,
      disableClickHandler,
    } = this.props;

    if (disableClickHandler) {
      return;
    }

    // Do not include form state changes if the current revision was
    // clicked.
    if (revision.recipe.revision_id === recipe.latest_revision_id) {
      dispatch(push(`/control/recipe/${recipe.id}/`));
    } else {
      dispatch(push({
        pathname: `/control/recipe/${recipe.id}/${revision.id}/`,
        state: { selectedRevision: revision.recipe },
      }));
    }
  }

  generateDiffList(difference) {
    if (!difference || !difference.length) {
      return null;
    }

    this.diffCache = this.diffCache || {};
    const cacheKey = difference.map(change => change.kind + change.path.join(':'));
    if (this.diffCache[cacheKey]) {
      return this.diffCache[cacheKey];
    }

    const displayedDifferences = this.getDisplayedDiffs(difference);

    this.diffCache[cacheKey] = (
      <ul className="change-list">
        {
          displayedDifferences.map(HistoryItem.generateDiffItem)
        }
      </ul>
    );

    return this.diffCache[cacheKey];
  }

  render() {
    const { showInfo } = this.state;
    const {
      revision,
      recipe,
      revisionId,
      forceShow,
      direction,
      hideActiveStatus,
    } = this.props;

    const approvalRequest = getRecipeApprovalRequest(recipe);

    const isLatest = revision.recipe.revision_id === recipe.latest_revision_id;
    const isCurrentlyViewing = revision.recipe.revision_id === recipe.latest_revision_id
      || revisionId === recipe.latest_revision_id;
    const isApproved = approvalRequest && approvalRequest.approved;

    // additional color-coded classes
    // (basically, selected = blue, approved = green)
    const colorClasses = cx(
      !hideActiveStatus && isLatest && 'color-red',
      !hideActiveStatus && isCurrentlyViewing && 'color-blue',
      isApproved && !isCurrentlyViewing && 'color-green'
    );

    const Element = this.props.el || 'div';

    const lastUpdated = moment(revision.recipe.last_updated);
    let lastUpdatedString = lastUpdated.format('MMM Do, YYYY');

    // if the last update was made today,
    if (lastUpdatedString === moment().format('MMM Do, YYYY')) {
      // add an 'x mins ago' bit of text
      lastUpdatedString = `${lastUpdatedString} (${lastUpdated.fromNow()})`;
    } else {
      // otherwise, format it as xx:yy pm
      lastUpdatedString = `${lastUpdatedString} (${lastUpdated.format('h:mma')})`;
    }

    const revisionDiff = this.props.previous ?
      diff(this.props.previous.recipe, revision.recipe)
      : [];

    const objDiffInfo = this.getDisplayedDiffs(revisionDiff);
    const elDiffList = showInfo && this.generateDiffList(revisionDiff);


    const rootClass = cx('history-item', colorClasses);
    const lblNumChanges = `${objDiffInfo.length} changes`;
    const lblHistoryButton = `${showInfo ? '-' : '+'} ${lblNumChanges}`;

    const arrowDir = direction === 'asc' ? 'up' : 'down';

    const revisionLabel = revision.recipe.revision_id ?
      `Revision ${revision.recipe.revision_id.slice(0, 7)}...`
      : '';

    return (
      <Element
        className={rootClass}
      >
        {
          !hideActiveStatus && isCurrentlyViewing &&
            <i
              className={'currently-viewing fa pre fa-eye'}
              title={'You are currently viewing this revision.'}
            />
        }
        <div className="history-content">
          <div onClick={this.handleClick}>
            <div
              className="history-id"
              title={revision.recipe.revision_id}
            >
              <DraftStatusIcon
                className={colorClasses}
                request={getRecipeApprovalRequest(revision.recipe)}
              />
              { revisionLabel }
              <small>
               { lastUpdatedString }
              </small>
              {
                revision.comment &&
                  <pre className="history-comment" children={revision.comment} />
              }
            </div>
          </div>
          {
            !forceShow && revisionDiff && !!revisionDiff.length &&
              <span
                className="show-changes"
                children={lblHistoryButton}
                onClick={() => {
                  this.setState({
                    showInfo: !showInfo,
                  });
                }}
              />
          }
          { elDiffList }
        </div>
        <i className={`fa fa-long-arrow-${arrowDir}`} aria-hidden="true" />
      </Element>
    );
  }
}
