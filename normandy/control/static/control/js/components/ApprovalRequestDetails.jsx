import React from 'react'
import nl2br from 'react-nl2br'
import moment from 'moment'
import ApprovalRequestCommentForm from './ApprovalRequestCommentForm.jsx'
import composeApprovalRequestContainer from './ApprovalRequestContainer.jsx'
import ControlActions from '../actions/ControlActions.js'

class ApprovalRequestComment extends React.Component {
  render() {
    const { comment } = this.props;

    return (
      <li>
        <div className="comment-meta">
          <strong>{comment.creator.username}</strong> commented { moment(comment.created).fromNow() }
        </div>
        <div className="comment-text">{nl2br(comment.text)}</div>
      </li>
    )
  }
}

export class ApprovalRequestDetails extends React.Component {
  approveRequest() {
    const { dispatch, approvalRequest } = this.props;
    dispatch(ControlActions.makeApiRequest('approveApprovalRequest', {approvalRequestId: approvalRequest.id}));
  }

  closeRequest() {
    const { dispatch, approvalRequest } = this.props;
    dispatch(ControlActions.makeApiRequest('rejectApprovalRequest', {approvalRequestId: approvalRequest.id}));
  }

  render() {
    const { approvalRequest } = this.props;

    return (
      <div>
        <div className="fluid-2 float-right" id="approval-request-details">
          {
            approvalRequest ?
              <div id="approval-request-meta">
                <div className="row">
                  <label>Request Opened:</label>
                  <span>
                    { moment(approvalRequest.created).format('MMM Do YYYY') } by <strong>{approvalRequest.creator.username}</strong>
                  </span>
                </div>

                <div className="row">
                  <label>Request Status:</label>
                  <span>
                    { approvalRequest.active ? 'Open' : approvalRequest.is_approved ? 'Approved' : 'Closed' }
                  </span>
                </div>
              </div> : ''
          }
          {
            approvalRequest && approvalRequest.active && !approvalRequest.is_approved ?
              <div className="form-action-buttons">
                <div className="row">
                  <button className="button green" onClick={::this.approveRequest}>Approve Request</button>
                </div>
                <div className="row">
                  <button className="button red" onClick={::this.closeRequest}>Close Request</button>
                </div>
              </div> : ''
          }
        </div>
        <ul className="fluid-6" id="comments-list">
          {
            this.props.approvalRequestComments.length ?
              this.props.approvalRequestComments.map(comment =>
                <ApprovalRequestComment comment={comment} dispatch={this.props.dispatch} key={comment.id} />
              ) : <li>No comments posted yet.</li>
          }
        </ul>
        <ApprovalRequestCommentForm approvalRequest={this.props.approvalRequest} />
      </div>
    );
  }
}

export default composeApprovalRequestContainer(ApprovalRequestDetails)