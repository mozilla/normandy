import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';

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

  static defaultColumnConfig = [{
    label: 'Name',
    value: 'name',
    enabled: true,
  }, {
    label: 'Action Name',
    value: 'action',
    enabled: true,
  }, {
    label: 'Enabled',
    value: 'enabled',
    enabled: true,
  }, {
    label: 'Channels',
    value: 'channels',
  }, {
    label: 'Locales',
    value: 'locales',
  }, {
    label: 'Countries',
    value: 'countries',
  }, {
    label: 'Start Time',
    value: 'startTime',
  }, {
    label: 'End Time',
    value: 'endTime',
  }, {
    label: 'Additional Filters',
    value: 'additionalFilter',
  }, {
    label: 'Last Updated',
    value: 'last_updated',
    enabled: true,
  }, {
    label: 'Metadata',
    value: 'metadata',
    enabled: true,
  }];

  constructor(props) {
    super(props);
    this.state = {
      columns: [],
    };

    this.handleFilterChange = ::this.handleFilterChange;
    this.handleColumnInput = ::this.handleColumnInput;

    this.handleFilterChange();
  }

  componentWillMount() {
    localForage.getItem('columns', (err, found) => {
      this.setState({
        columns: found || RecipeFilters.defaultColumnConfig,
      });
      this.handleFilterChange();
    });
  }

  handleFilterChange() {
    const selected = [];
    this.state.columns.forEach(col => {
      if (col.enabled === true) {
        selected.push(col);
      }
    });

    localForage.setItem('columns', this.state.columns);

    this.props.onFilterChange(selected);
  }

  handleColumnInput(columnIndex, isActive) {
    const newColumns = [].concat(this.state.columns || []);
    newColumns[columnIndex].enabled = isActive;

    // update local state
    this.setState({
      columns: newColumns,
    });

    this.handleFilterChange();
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
            columns={this.state.columns}
            onInputChange={this.handleColumnInput}
          />
        </div>
      </div>
    );
  }
}
