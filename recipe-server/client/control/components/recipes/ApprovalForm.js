import { Button, Form, Input, Modal } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import handleError from 'control/utils/handleError';
import { SimpleLoadingOverlay } from 'control/components/common/LoadingOverlay';
import FormActions from 'control/components/forms/FormActions';
import FormItem from 'control/components/forms/FormItem';
import {
  closeApprovalRequest as closeApprovalRequestAction,
} from 'control/state/app/approvalRequests/actions';
import { createForm, ValidationError } from 'control/utils/forms';

@connect(
  null,
  {
    closeApprovalRequest: closeApprovalRequestAction,
  },
)
@createForm({})
@autobind
export default class ApprovalForm extends React.PureComponent {
  static propTypes = {
    approvalRequest: PropTypes.instanceOf(Map).isRequired,
    closeApprovalRequest: PropTypes.func.isRequired,
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
  };

  static defaultProps = {
    isSubmitting: false,
  };

  handleApproveClick(event) {
    this.props.form.validateFields(error => {
      if (error) {
        handleError('Unable to approve request.', new ValidationError(error));
      } else {
        this.props.onSubmit(event, { approved: true });
      }
    });
  }

  handleRejectClick(event) {
    this.props.form.validateFields(error => {
      if (error) {
        handleError('Unable to reject request.', new ValidationError(error));
      } else {
        this.props.onSubmit(event, { approved: false });
      }
    });
  }

  handleCloseButtonClick() {
    const { approvalRequest, closeApprovalRequest } = this.props;
    Modal.confirm({
      title: 'Are you sure you want to close this approval request?',
      async onOk() {
        try {
          await closeApprovalRequest(approvalRequest.get('id'));
        } catch (err) {
          handleError('Unable to close request.', err);
        }
      },
    });
  }

  render() {
    const { isSubmitting } = this.props;

    return (
      <Form>
        <FormItem name="comment">
          <Input placeholder="Comment" disabled={isSubmitting} />
        </FormItem>
        <SimpleLoadingOverlay isVisible={isSubmitting}>
          <FormActions>
            <FormActions.Primary>
              <Button icon="dislike" onClick={this.handleRejectClick} type="danger" id="af-reject">
                  Reject
                </Button>
              <Button icon="like" onClick={this.handleApproveClick} type="primary" id="af-approve">
                Approve
              </Button>
            </FormActions.Primary>
            <FormActions.Secondary>
              <Button icon="close-circle" onClick={this.handleCloseButtonClick}>
                Close
              </Button>
            </FormActions.Secondary>
          </FormActions>
        </SimpleLoadingOverlay>
      </Form>
    );
  }
}
