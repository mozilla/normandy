import { Icon, Input } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * URL input that displays a clickable link to its value.
 */
export default class DocumentUrlInput extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    // rc-form warns if the component already has a value prop, but doesn't
    // initially provide it. So we can't have a default, and also can't require
    // it.
    // eslint-disable-next-line react/require-default-props
    value: PropTypes.string,
  };

  static defaultProps = {
    disabled: false,
  };

  render() {
    const { disabled, value, ...props } = this.props;
    let addonAfter = <span><Icon type="link" /> View</span>;
    if (value) {
      addonAfter = (
        <a href={this.props.value} target="_blank" rel="noopener noreferrer">
          {addonAfter}
        </a>
      );
    }

    return (
      <Input
        disabled={disabled}
        type="url"
        addonAfter={addonAfter}
        value={value}
        {...props}
      />
    );
  }
}
