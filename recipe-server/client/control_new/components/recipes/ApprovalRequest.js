import { Card, Col, message, Row, Tag } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ApprovalForm from 'control_new/components/recipes/ApprovalForm';
import ApprovalDetails from 'control_new/components/recipes/ApprovalDetails';
import RecipeDetails from 'control_new/components/recipes/RecipeDetails';
import {
  approveApprovalRequest as approveApprovalRequestAction,
  rejectApprovalRequest as rejectApprovalRequestAction,
} from 'control_new/state/app/approvalRequests/actions';
import {
  getRecipeForRevision,
  isRevisionPendingApproval,
} from 'control_new/state/app/revisions/selectors';


@connect(
  (state, { revision }) => ({
    approvalRequest: revision.get('approval_request', new Map()),
    recipe: getRecipeForRevision(state, revision.get('id'), new Map()),
    isPendingApproval: isRevisionPendingApproval(state, revision.get('id')),
  }),
  {
    approveApprovalRequest: approveApprovalRequestAction,
    rejectApprovalRequest: rejectApprovalRequestAction,
  },
)
@autobind
export default class ApprovalRequest extends React.PureComponent {
  static propTypes = {
    approvalRequest: PropTypes.instanceOf(Map).isRequired,
    approveApprovalRequest: PropTypes.func.isRequired,
    isPendingApproval: PropTypes.bool.isRequired,
    recipe: PropTypes.instanceOf(Map).isRequired,
    rejectApprovalRequest: PropTypes.func.isRequired,
    revision: PropTypes.instanceOf(Map).isRequired,
  };

  state = {
    formErrors: {},
    isSubmitting: false,
  };

  async handleSubmit(values, context) {
    const {
      approvalRequest,
      approveApprovalRequest,
      rejectApprovalRequest,
    } = this.props;

    this.setState({
      isSubmitting: true,
    });

    let action;
    let successMessage;

    if (context.approved) {
      action = approveApprovalRequest;
      successMessage = 'Request approved';
    } else {
      action = rejectApprovalRequest;
      successMessage = 'Request rejected';
    }

    try {
      await action(approvalRequest.get('id'), values);
      message.success(successMessage);
    } catch (error) {
      if (error.data) {
        this.setState({ formErrors: error.data });

        // `error.data` is an object of invalid fields and the corresponding error
        // message. `join`ing them here will produce a single error for the toast.
        message.error(Object.values(error.data).join(' '));
      } else {
        message.error(
          'Approval could not be submitted. Please correct any errors listed in the form below.',
        );
      }
    } finally {
      this.setState({
        isSubmitting: false,
      });
    }
  }

  render() {
    const { isSubmitting } = this.state;
    const { approvalRequest, isPendingApproval, recipe } = this.props;
    const errors = this.state.formErrors;

    let extra;

    if (isPendingApproval) {
      extra = <Tag color="yellow">Pending</Tag>;
    } else if (approvalRequest.get('approved')) {
      extra = <Tag color="green">Approved</Tag>;
    } else {
      extra = <Tag color="red">Rejected</Tag>;
    }

    const detailSection = isPendingApproval ?
      (<ApprovalForm
        approvalRequest={approvalRequest}
        isSubmitting={isSubmitting}
        onSubmit={this.handleSubmit}
        errors={errors}
      />)
      : <ApprovalDetails request={approvalRequest} />;

    return (
      <div className="approval-history-details">
        <Row gutter={24}>
          <Col span={16}>
            <RecipeDetails recipe={recipe} />
          </Col>
          <Col span={8}>
            <Card title="Approval Request" extra={extra}>
              <div className="request-metadata">
                <dl className="details narrow">
                  <dt>Requested by</dt>
                  <dd>{approvalRequest.getIn(['creator', 'email'])}</dd>

                  <dt>Requested</dt>
                  <dd title={moment(approvalRequest.get('created')).format('MMMM Do YYYY, h:mm a')}>
                    {moment(approvalRequest.get('created')).fromNow()}
                  </dd>
                </dl>
              </div>

              <div className="approval-details">
                { detailSection }
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
