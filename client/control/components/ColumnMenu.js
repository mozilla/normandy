import React, { PropTypes as pt } from 'react';

import CheckboxList from 'control/components/CheckboxList';
import DropdownMenu from 'control/components/DropdownMenu';

/**
 * Simple dropdown/checkbox list combo used to handle
 * managing visible columns in RecipeList.
 *
 * #TODO Column management should happen in here, NOT
 * in RecipeFilters
 */

export default class ColumnMenu extends React.Component {
  static propTypes = {
    onColumnChange: pt.func.isRequired,
    columns: pt.array.isRequired,
  };

  // The trigger element never changes,
  // so we can define it as a static const
  static trigger = (
    <span className="col-trigger">
      <span className="fa fa-columns" />
      Columns
    </span>
  );

  /**
   * Render
   */
  render() {
    const { columns } = this.props;
    return (
      <DropdownMenu
        pinRight
        useClick
        trigger={ColumnMenu.trigger}
      >
        <CheckboxList
          options={columns}
          onInputChange={this.props.onColumnChange}
        />
      </DropdownMenu>
    );
  }
}
