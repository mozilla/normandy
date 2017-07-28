import { Map } from 'immutable';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

export default class ApprovalDetails extends React.PureComponent {
  static propTypes = {
    request: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { request } = this.props;

    return (
      <dl className="details narrow">
        <dt>
          {request.get('approved') ? 'Approved' : 'Rejected'} by
        </dt>
        <dd>
          {request.getIn(['approver', 'email'])}
        </dd>

        <dt>Responsed</dt>
        <dd title={moment(request.get('created')).format('MMMM Do YYYY, h:mm a')}>
          {moment(request.get('created')).fromNow()}
        </dd>

        <dt>Comment</dt>
        <dd>{request.get('comment')}</dd>
      </dl>
    );
  }
}
