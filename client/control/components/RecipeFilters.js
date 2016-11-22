/* eslint-disable import/no-named-as-default */
import React, { PropTypes as pt } from 'react';
import SwitchFilter from './SwitchFilter.js';
import ColumnMenu from './ColumnMenu.js';

export default class RecipeFilters extends React.Component {
  static propTypes = {
    searchText: pt.string.isRequired,
    selectedFilter: pt.any.isRequired,
    updateSearch: pt.func.isRequired,
    updateFilter: pt.func.isRequired,
    onFilterChange: pt.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};

    this.handleFilterChange = ::this.handleFilterChange;
  }

  handleFilterChange(filters) {
    if (this.props.onFilterChange) {
      this.props.onFilterChange(filters);
    }
  }

  render() {
    const {
      searchText,
      updateSearch,
      selectedFilter,
      updateFilter,
    } = this.props;

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="fluid-2">
            <div className="search input-with-icon">
              <input
                type="text"
                placeholder="Search"
                initialValue={searchText}
                onChange={updateSearch}
              />
            </div>
          </div>
          <div id="filters-container" className="fluid-6">
            <h4>Filter By:</h4>
            <SwitchFilter
              options={['All', 'Enabled', 'Disabled']}
              selectedFilter={selectedFilter}
              updateFilter={updateFilter}
            />
          </div>
        </div>
        <div className="fluid-8">
          <ColumnMenu
            onSelectionChange={this.handleFilterChange}
          />
        </div>
      </div>
    );
  }
}
