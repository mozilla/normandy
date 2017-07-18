import { Button, Form, Input } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import FormActions from 'control_new/components/common/FormActions';
import { createForm, FormItem } from 'control_new/components/common/forms';

@createForm({
  validateFields(values) {
    return values;
  },
})
@autobind
export default class ApprovalForm extends React.Component {
  static propTypes = {
    approvalRequest: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }

  handleApproveClick(event) {
    this.props.onSubmit(event, { approved: true });
  }

  handleRejectClick(event) {
    this.props.onSubmit(event, { approved: false });
  }

  render() {
    const { onSubmit } = this.props;

    return (
      <Form onSubmit={onSubmit}>
        <FormItem name="comment">
          <Input placeholder="Comment" />
        </FormItem>
        <FormActions>
          <FormActions.Primary>
            <Button onClick={this.handleApproveClick} type="primary">
              Approve
            </Button>
          </FormActions.Primary>
          <FormActions.Secondary>
            <Button onClick={this.handleRejectClick} type="primary">
              Reject
            </Button>
          </FormActions.Secondary>
        </FormActions>
      </Form>
    );
  }
}
