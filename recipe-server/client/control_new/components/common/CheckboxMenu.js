import { Button, Checkbox, Dropdown } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';


export default class CheckboxMenu extends React.Component {
  static propTypes = {
    checkboxes: PropTypes.array,
    label: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.array,
  };

  static defaultProps = {
    checkboxes: null,
    label: null,
    onChange: null,
    options: null,
  };

  render() {
    const { checkboxes, label, onChange, options } = this.props;

    const menu = (
      <Checkbox.Group
        onChange={onChange}
        options={options}
        defaultValue={checkboxes}
      />
    );

    return (
      <Dropdown overlay={menu}>
        <Button icon="bars">{label}</Button>
      </Dropdown>
    );
  }
}
