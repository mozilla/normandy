import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import { fetchExperiments } from 'control/state/app/experimenter/actions';
import { getExperimenterAPIUrl } from 'control/state/app/serviceInfo/selectors';

@connect(
  state => ({ experimenterAPIUrl: getExperimenterAPIUrl(state) }),
  { fetchExperiments },
)
export default class QueryExperiments extends React.Component {
  static propTypes = {
    experimenterAPIUrl: pt.string,
    fetchExperiments: pt.func.isRequired,
  };

  static defaultProps = {
    experimenterAPIUrl: null,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.experimenterAPIUrl) {
      nextProps.fetchExperiments(nextProps.experimenterAPIUrl);
    }
  }

  render() {
    return null;
  }
}
