import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'redux-little-router';
import { connect } from 'react-redux';

@connect((state, { record }) => {
  const isEnabled = record.enabled;
  const isPaused = !isEnabled || !!record.arguments.isEnrollmentPaused;

  return {
    record,
    isEnabled,
    isPaused,
  };
})
export default class EnrollmentSatus extends React.PureComponent {
  static propTypes = {
    // Ideally this would be an Immutable Map, but Ant's table works with POJO's.
    record: PropTypes.object.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
  };

  getLabel() {
    const {
      isEnabled,
      isPaused,
    } = this.props;
    let label = 'Disabled';

    if (isEnabled) {
      label = isPaused ? 'Paused' : 'Active';
    }

    return label;
  }

  getIcon() {
    const {
      isEnabled,
      isPaused,
    } = this.props;
    let label = 'minus';

    if (isEnabled) {
      label = isPaused ? 'pause' : 'check';
    }

    return label;
  }

  getColor() {
    const {
      isEnabled,
      isPaused,
    } = this.props;

    let colorClass;
    if (isEnabled) {
      colorClass = isPaused ? 'is-false' : 'is-true';
    }

    return colorClass;
  }

  render() {
    const {
      record,
      isEnabled,
    } = this.props;

    return (
      <Link href={`/recipe/${record.id}/`} className={isEnabled ? '' : 'is-lowkey'}>
        <Icon
          className={this.getColor()}
          type={this.getIcon()}
        />
        <span className="enrollment-label">{this.getLabel()}</span>
      </Link>
    );
  }
}
