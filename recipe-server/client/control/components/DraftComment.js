import React, { PropTypes as pt } from 'react';

export default function DraftComment(props) {
  const {
    request,
  } = props;

  if (!request || !request.comment) {
    return null;
  }

  return (
    <div className="status-indicator">
      { request.comment }
    </div>
  );
}

DraftComment.propTypes = {
  request: pt.object,
};
