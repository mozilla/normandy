import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import ColumnMenu from 'control/components/ColumnMenu';

import {
  loadLocalColumns,
} from 'control/actions/ColumnActions';

/**
 * Filters displayed above the RecipeList table.
 */
class RecipeFilters extends React.Component {
  static propTypes = {
    onSearchChange: pt.func.isRequired,
    // connected
    dispatch: pt.func.isRequired,
    columns: pt.array.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  /**
   * Loads user's last column display setup,
   * as well as their last active list filters.
   *
   * @return {void}
   */
  componentWillMount() {
    // load the last column setup user was viewing
    this.props.dispatch(loadLocalColumns());
  }

  /**
   * Render
   */
  render() {
    const {
      columns,
      onSearchChange,
    } = this.props;

    const {
      searchText,
    } = this.state;

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search" className="fluid-2">
            <div className="search input-with-icon">
              <input
                type="text"
                placeholder="Search"
                value={searchText}
                onChange={onSearchChange}
              />
            </div>
          </div>

          <div id="filters-container" className="fluid-6">
            <ColumnMenu
              columns={columns}
              onColumnChange={this.handleColumnInput}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  // columns
  columns: state.columns,
});

export default connect(
  mapStateToProps
)(RecipeFilters);
