import React from 'react'
import { reduxForm, getValues } from 'redux-form'

import ControlActions from '../actions/ControlActions.js'


export class ApprovalRequestCommentForm extends React.Component {
  submitForm() {
    const { dispatch, formState, approvalRequest } = this.props;
    let values = getValues(formState.approvalRequestComment);
    dispatch(ControlActions.makeApiRequest('createApprovalRequestComment', {approvalRequestId: approvalRequest.id, ...values}));
  }

  render() {
    const { fields: { text }, approvalRequest, handleSubmit } = this.props;

    return (
      <form id="comment-form" onSubmit={handleSubmit(::this.submitForm)}>
        <div className="fluid-6 row">
          <textarea placeholder="Add comment&hellip;" field={text} {...text} />
        </div>
        <div className="fluid-6 form-action-buttons">
          <button className="button" type="submit">Comment</button>
        </div>
      </form>
    )
  }
}

export default reduxForm({
    form: 'approvalRequestComment'
  }, (state, props) => {
    let fields = ['text'];

    return {
      fields,
      formState: state.form
    }
})(ApprovalRequestCommentForm)
