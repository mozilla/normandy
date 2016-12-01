import React, { PropTypes as pt } from 'react';

import CheckboxList from 'control/components/CheckboxList';
import DropdownMenu from 'control/components/DropdownMenu';

export default class ColumnMenu extends React.Component {
  static propTypes = {
    onColumnChange: pt.func.isRequired,
    columns: pt.array.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { columns } = this.props;
    return (
      <DropdownMenu
        pinRight
        useClick
        trigger={
          <span className="col-trigger">
            <span className="fa fa-columns" />
            Columns
          </span>
        }
      >
        <CheckboxList
          options={columns}
          onInputChange={this.props.onColumnChange}
        />
      </DropdownMenu>
    );
  }
}
