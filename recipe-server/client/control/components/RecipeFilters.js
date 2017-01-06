import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import ColumnMenu from 'control/components/ColumnMenu';

import {
  loadLocalColumns,
} from 'control/actions/ColumnActions';

/**
 * Filters displayed above the RecipeList table.
 *
 * @prop {Function} onSearchChange   Handler to trigger when user has altered search text.
 * @prop {string}   searchText       String user is filtering recipes against
 * @prop {string}   loadLocalColumns Connect'd fn to load columns from localForage
 * @prop {Array<object>}   columns   Connect'd array of columns ({ label, value, enabled })
 */
class RecipeFilters extends React.Component {
  static propTypes = {
    onSearchChange: pt.func.isRequired,
    searchText: pt.string.isRequired,
    loadLocalColumns: pt.func.isRequired,
    columns: pt.array.isRequired,
  };

  /**
   * Loads user's last column display setup,
   * as well as their last active list filters.
   *
   * @return {void}
   */
  componentWillMount() {
    // load the last column setup user was viewing
    this.props.loadLocalColumns();
  }

  /**
   * Render
   */
  render() {
    const {
      columns,
      onSearchChange,
      searchText,
    } = this.props;

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
  mapStateToProps,
  { loadLocalColumns }
)(RecipeFilters);
