import React, { PropTypes as pt } from 'react';
import DraftStatusIcon from 'control/components/DraftStatusIcon';
import { getRecipeApprovalRequest } from 'control/selectors/RecipesSelector';

export default function DraftStatus(props) {
  const {
    recipe,
  } = props;

  const request = getRecipeApprovalRequest(recipe);
  let status = !!request || 'Draft';

  if (request) {
    const {
      approved,
    } = request;

    if (approved) {
      status = 'Approved';
    } else {
      status = 'Pending review';
    }
  }

  return (
    <div className={'status-indicator'}>
      <DraftStatusIcon
        request={request}
        statusText={status}
      />
      {status}
    </div>
  );
}
DraftStatus.propTypes = {
  recipe: pt.object.isRequired,
};
