/* eslint-disable react/no-did-mount-set-state */
import { Button, Popover, Icon } from 'antd';
import autobind from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';

import ShieldIdenticon from 'control_new/components/common/ShieldIdenticon';

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

  state = {
    history: [],
    index: -1,
  };

  componentDidMount() {
    const { value } = this.props;

    if (value) {
      this.setState({
        index: 0,
        history: [value],
      });

      // Fire an onChange to prevent `initialValue` changing when creating a
      // new recipe.
      this.props.onChange(value);
    }
  }

  componentWillReceiveProps({ value }) {
    if (this.state.index === -1 && value) {
      this.setState({
        index: 0,
        history: [value],
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

    next = history[newIndex];

    let newHistory = [...history];
    if (!next) {
      next = IdenticonField.generateSeed();
      if (newHistory.indexOf(next) === -1) {
        newHistory = [...history, next];
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
          content={<ShieldIdenticon seed={this.props.value} size={256} />}
          placement="right"
        >
          <div className="shield-container">
            <ShieldIdenticon seed={this.props.value} key={this.props.value} />
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
