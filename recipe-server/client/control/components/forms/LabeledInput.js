// eslint does not detect that aria roles come from `getLabelProps`,
// ignoring the rule here to disable lint errors.
/* eslint-disable jsx-a11y/interactive-supports-focus */

import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

@autobind
export default class LabeledInput extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    element: PropTypes.node,
    onChange: PropTypes.func,
    value: PropTypes.any,
  };

  static defaultProps = {
    children: null,
    element: undefined,
    onChange: () => {},
    value: undefined,
  }

  getElement() { throw new Error('LabeledInput#getElement must be overridden.'); }

  getLabelProps() { return { role: 'input' }; }

  getElementProps() { return {}; }

  handleLabelClick() {}

  render() {
    const {
      children,
      value,
      onChange,
    } = this.props;

    const Element = this.getElement();

    return (
      <label className="labeled-input">
        <Element
          onChange={onChange}
          {...this.getElementProps()}
        />

        {
          children &&
            <span
              className="label"
              onClick={this.handleLabelClick}
              {...this.getLabelProps()}
            >
              { children }
            </span>
        }
      </label>
    );
  }
}
