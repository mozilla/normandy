import { Button, Checkbox, Dropdown } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';


export default function ColumnSelector({ columns, onChange, options }) {
  const menu = (
    <Checkbox.Group
      onChange={onChange}
      options={options}
      defaultValue={columns}
    />
  );

  return (
    <Dropdown overlay={menu}>
      <Button icon="bars">Columns</Button>
    </Dropdown>
  );
}

ColumnSelector.propTypes = {
  columns: PropTypes.array,
  onChange: PropTypes.func,
  options: PropTypes.array,
};
