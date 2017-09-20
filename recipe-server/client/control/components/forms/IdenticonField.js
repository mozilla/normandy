import { Button, Popover, Icon } from 'antd';
import { fromJS, List } from 'immutable';
import autobind from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';

import ShieldIdenticon from 'control/components/common/ShieldIdenticon';

@autobind
export default class IdenticonField extends React.PureComponent {
  static propTypes = {
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    disabled: false,
    value: null,
  };

  static generateSeed() {
    return `v1:${Math.random().toString(36).substr(2)}`;
  }

  constructor(props) {
    super(props);

    this.state = {
      history: props.value ? fromJS([props.value]) : new List(),
      index: props.value ? 0 : -1,
    };
  }

  componentWillReceiveProps({ value }) {
    if (this.state.index === -1 && value) {
      this.setState({
        index: 0,
        history: fromJS([value]),
      });
    }
  }

  handleChange(direction) {
    let next;
    const {
      index,
      history,
    } = this.state;
    const newIndex = index + direction;


    if (newIndex < 0) {
      return;
    }

    next = history.get(newIndex);

    let newHistory = history;
    if (!next) {
      next = IdenticonField.generateSeed();

      // Ensure duplicate entries are not saved in history.
      if (newHistory.indexOf(next) === -1) {
        newHistory = newHistory.push(next);
      }
    }

    this.setState({
      index: newIndex,
      history: newHistory,
    });
    this.props.onChange(next);
  }

  handlePrev() {
    this.handleChange(-1);
  }

  handleNext() {
    this.handleChange(1);
  }

  render() {
    const {
      value,
    } = this.props;

    return (
      <div className="identicon-field">
        <Button
          size="small"
          type="primary"
          disabled={this.props.disabled || this.state.index <= 0}
          onClick={this.handlePrev}
        >
          <Icon type="left" />
        </Button>

        <Popover
          mouseEnterDelay={0.75}
          content={<ShieldIdenticon seed={value} size={256} />}
          placement="right"
        >
          <div className="shield-container">
            <ShieldIdenticon seed={value} key={value} />
          </div>
        </Popover>

        <Button
          size="small"
          type="primary"
          disabled={this.props.disabled}
          onClick={this.handleNext}
        >
          <Icon type="right" />
        </Button>
      </div>
    );
  }
}
