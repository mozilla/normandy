import React, { PropTypes as pt } from 'react';
import cx from 'classnames';
import HistoryItem from 'control/components/HistoryItem';

export default function HistoryList({
  isRecipeContainer,
  recipe,
  revisions,
  dispatch,
  direction,
}) {
  return (
    <ul className={cx('recipe-history', isRecipeContainer && 'is-full')}>
      {revisions.map((revision, index) =>
        <HistoryItem
          el={'li'}
          key={`${revision.id} ${index}`}
          revision={revision}
          revisionId={revision.id}
          recipe={recipe}
          previous={revisions[index + (direction === 'asc' ? 1 : -1)]}
          forceShow={isRecipeContainer}
          hideActiveStatus={isRecipeContainer}
          disableClickHandler={isRecipeContainer}
          dispatch={dispatch}
          direction={direction}
        />
      )}
    </ul>
  );
}
HistoryList.propTypes = {
  dispatch: pt.func.isRequired,
  recipe: pt.object.isRequired,
  revisions: pt.arrayOf(pt.object).isRequired,
  isRecipeContainer: pt.bool,
  direction: pt.oneOf(['asc', 'desc']),
};
