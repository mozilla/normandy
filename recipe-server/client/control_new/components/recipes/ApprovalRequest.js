import { Button, Card, Col, message, Modal, Row, Tag } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ApprovalForm from 'control_new/components/recipes/ApprovalForm';
import Details from 'control_new/components/recipes/Details';
import * as approvalRequestActions from 'control_new/state/approvalRequests/actions';
import {
  getRecipeForRevision,
  isRevisionPendingApproval,
} from 'control_new/state/revisions/selectors';


@connect(
  (state, { revision }) => ({
    approvalRequest: revision.get('approval_request', new Map()),
    recipe: getRecipeForRevision(state, revision.get('id'), new Map()),
    isPendingApproval: isRevisionPendingApproval(state, revision.get('id')),
  }),
  {
    approveApprovalRequest: approvalRequestActions.approveApprovalRequest,
    closeApprovalRequest: approvalRequestActions.closeApprovalRequest,
    rejectApprovalRequest: approvalRequestActions.rejectApprovalRequest,
  },
)
@autobind
export default class ApprovalRequest extends React.Component {
  static propTypes = {
    approvalRequest: PropTypes.object.isRequired,
    approveApprovalRequest: PropTypes.func.isRequired,
    closeApprovalRequest: PropTypes.func.isRequired,
    isPendingApproval: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    rejectApprovalRequest: PropTypes.func.isRequired,
    revision: PropTypes.object.isRequired,
  };

  state = {
    formErrors: {},
  };

  handleCloseButtonClick() {
    const { approvalRequest, closeApprovalRequest } = this.props;
    Modal.confirm({
      title: 'Are you sure you want to close this approval request?',
      onOk() {
        closeApprovalRequest(approvalRequest.get('id'));
      },
    });
  }

  async handleSubmit(values, context) {
    const {
      approvalRequest,
      approveApprovalRequest,
      rejectApprovalRequest,
    } = this.props;

    let action;
    let successMessage;

    // The form submits if the user hits enter in the comment field. To ensure we are only
    // submitting an approval or rejection when one of the buttons is explicitly clicked we
    // do a strict comparison to the expected boolean values.
    if (context.approved === true) {
      action = approveApprovalRequest;
      successMessage = 'Request approved';
    } else if (context.approved === false) {
      action = rejectApprovalRequest;
      successMessage = 'Request rejected';
    }

    if (action) {
      try {
        await action(approvalRequest.get('id'), values);
        message.success(successMessage);
      } catch (error) {
        if (error.data.error) {
          message.error(error.data.error);
        } else {
          message.error(
            'Approval could not be submitted. Please correct any errors listed in the form below.',
          );
        }
        if (error.data) {
          this.setState({ formErrors: error.data });
        }
      }
    }
  }

  renderRequestDetails() {
    const { approvalRequest } = this.props;

    return (
      <dl className="details narrow">
        <dt>
          {approvalRequest.get('approved') ? 'Approved' : 'Rejected'} by
        </dt>
        <dd>
          {approvalRequest.getIn(['approver', 'email'])}
        </dd>

        <dt>Response Date</dt>
        <dd>{moment(approvalRequest.get('created')).format('MMMM Do YYYY, h:mm a')}</dd>

        <dt>Comment</dt>
        <dd>{approvalRequest.get('comment')}</dd>
      </dl>
    );
  }

  render() {
    const { approvalRequest, isPendingApproval, recipe } = this.props;

    let extra;

    if (isPendingApproval) {
      extra = (
        <Button icon="close-circle" size="small" onClick={this.handleCloseButtonClick}>
          Close
        </Button>
      );
    } else if (approvalRequest.get('approved')) {
      extra = <Tag color="green">Approved</Tag>;
    } else {
      extra = <Tag color="red">Rejected</Tag>;
    }

    return (
      <div className="approval-history-details">
        <Row gutter={24}>
          <Col span={16}>
            <Details recipe={recipe} />
          </Col>
          <Col span={8}>
            <Card title="Approval Request" extra={extra}>
              <div className="request-metadata">
                <dl className="details narrow">
                  <dt>Requested by</dt>
                  <dd>{approvalRequest.getIn(['creator', 'email'])}</dd>

                  <dt>Request Date</dt>
                  <dd>{moment(approvalRequest.get('created')).format('MMMM Do YYYY, h:mm a')}</dd>
                </dl>
              </div>

              <div className="approval-details">
                {
                  isPendingApproval ?
                    <ApprovalForm
                      approvalRequest={approvalRequest}
                      onSubmit={this.handleSubmit}
                      errors={this.state.formErrors}
                    />
                    : this.renderRequestDetails()
                }
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
