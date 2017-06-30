import { Button, Checkbox, Dropdown } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';


export default function CheckboxMenu({ checkboxes, label, onChange, options }) {
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

CheckboxMenu.propTypes = {
  checkboxes: PropTypes.array,
  label: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array,
};
