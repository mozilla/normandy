import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import CheckboxList from 'control/components/CheckboxList';
import DropdownMenu from 'control/components/DropdownMenu';

import {
  updateColumn,
} from 'control/actions/ColumnActions';

/**
 * Simple dropdown/checkbox list combo used to handle
 * managing visible columns in RecipeList.
 */

class ColumnMenu extends React.Component {
  static propTypes = {
    columns: pt.array.isRequired,
    // connected
    dispatch: pt.func.isRequired,
  };

  // The trigger element never changes,
  // so we can define it as a static const
  static trigger = (
    <span className="col-trigger">
      <span className="fa fa-columns" />
      Columns
    </span>
  );

  constructor(props) {
    super(props);
    this.state = {};

    this.handleColumnInput = ::this.handleColumnInput;
  }

  /**
   * User has de/activated a column. This handler
   * simply updates the component's column state,
   * and notifies the parent of what's selected
   *
   * Note: it seems a little fragile to use the index for this,
   * may be useful to switch to something more identifying.
   *
   * @param  {String} TODO
   * @param  {Boolean} isActive    Is the column now active?
   * @return {void}
   */
  handleColumnInput(columnValue, isActive) {
    this.props.dispatch(updateColumn({
      value: columnValue,
      isActive,
    }));
  }

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
          onInputChange={this.handleColumnInput}
        />
      </DropdownMenu>
    );
  }
}

const mapStateToProps = state => ({
  // columns
  columns: state.columns,
});

export default connect(
  mapStateToProps
)(ColumnMenu);
