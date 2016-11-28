import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';
import { connect } from 'react-redux';

import GroupMenu from 'control/components/GroupMenu';
import DropdownMenu from 'control/components/DropdownMenu';
import ColumnMenu from 'control/components/ColumnMenu';

class RecipeFilters extends React.Component {
  static propTypes = {
    searchText: pt.string.isRequired,
    updateSearch: pt.func.isRequired,
    updateFilter: pt.func.isRequired,
    onFilterChange: pt.func.isRequired,
    // connected
    availableFilters: pt.array.isRequired,
    selectedFilters: pt.array.isRequired,
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

    this.handleFilterChange(true);
  }

  componentWillMount() {
    localForage.getItem('columns', (err, found) => {
      this.setState({
        columns: found || RecipeFilters.defaultColumnConfig,
      });
      this.handleFilterChange(true);
    });
  }

  handleFilterChange(dontSave) {
    const selected = [];
    this.state.columns.forEach(col => {
      if (col.enabled === true) {
        selected.push(col);
      }
    });

    if (!dontSave) {
      localForage.setItem('columns', this.state.columns);
    }

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

  searchGroup(group, search) {
    const groupString = JSON.stringify(group).toLowerCase();
    const groupSearch = (search || '').toLowerCase();

    return groupString.indexOf(groupSearch) > -1;
  }

  filterGroups(groups, search) {
    return groups.filter(group => this.searchGroup(group, search));
  }

  render() {
    const {
      searchText,
      updateSearch,
    } = this.props;

    let result;

    if (searchText) {
      result = this.filterGroups(this.props.availableFilters, searchText);
    }

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search" className="fluid-2">
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
            <DropdownMenu
              trigger={
                <span>
                  <span className="fa fa-columns" />
                  Columns
                </span>
              }
            >
              <ColumnMenu
                columns={this.state.columns}
                onInputChange={this.handleColumnInput}
              />
            </DropdownMenu>
          </div>
        </div>
        <div className="fluid-8">
          <GroupMenu
            data={searchText ? result : this.props.availableFilters}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  availableFilters: state.filters.available || [],
  selectedFilters: state.filters.selected || [],
});

export default connect(
  mapStateToProps
)(RecipeFilters);
