// eslint does not detect that aria roles come from `getLabelProps`,
// ignoring the rule here to disable lint errors.
/* eslint-disable jsx-a11y/no-static-element-interactions */

import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

@autobind
export default class LabeledInput extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    children: null,
    onChange: () => {},
  }

  getElement() { throw new Error('LabeledInput#getElement must be overridden.'); }

  getLabelProps() { return { role: 'input' }; }

  getElementProps() { return {}; }

  handleLabelClick() {}

  render() {
    const {
      children,
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
