import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  fetchRevision as fetchRevisionAction,
} from 'control_new/state/app/revisions/actions';


@connect(
  null,
  {
    fetchRevision: fetchRevisionAction,
  },
)
export default class QueryRevision extends React.Component {
  static propTypes = {
    fetchRevision: PropTypes.func.isRequired,
    pk: PropTypes.string.isRequired,
  }

  componentWillMount() {
    const { fetchRevision, pk } = this.props;
    fetchRevision(pk);
  }

  componentWillReceiveProps(nextProps) {
    const { fetchRevision, pk } = this.props;
    if (pk !== nextProps.pk) {
      fetchRevision(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}
