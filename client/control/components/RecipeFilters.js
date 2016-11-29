import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';
import { connect } from 'react-redux';

import GroupMenu from 'control/components/GroupMenu';
import DropdownMenu from 'control/components/DropdownMenu';
import ColumnMenu from 'control/components/ColumnMenu';

import { selectFilter } from 'control/actions/FilterActions';

class RecipeFilters extends React.Component {
  static propTypes = {
    searchText: pt.string.isRequired,
    updateSearch: pt.func.isRequired,
    updateFilter: pt.func.isRequired,
    onFilterChange: pt.func.isRequired,
    // connected
    filters: pt.array.isRequired,
    selectedFilters: pt.array.isRequired,
    dispatch: pt.func.isRequired,
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
    this.onGroupFilterSelect = ::this.onGroupFilterSelect;

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

  onGroupFilterSelect(group, option) {
    this.props.dispatch(selectFilter({
      group,
      option,
      isEnabled: true,
    }));
  }

  searchGroup(group, search) {
    const groupString = JSON.stringify(group).toLowerCase();
    const groupSearch = (search || '').toLowerCase();

    return groupString.indexOf(groupSearch) > -1;
  }

  filterGroups(groups, search) {
    return groups.filter(group => this.searchGroup(group, search));
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

  render() {
    const {
      searchText,
      updateSearch,
    } = this.props;

    let result;

    if (searchText) {
      result = this.filterGroups(this.props.filters, searchText);
    }

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search" className="fluid-2">
            <div className="search input-with-icon">
              <DropdownMenu
                useFocus
                trigger={
                  <input
                    type="text"
                    placeholder="Search"
                    initialValue={searchText}
                    onChange={updateSearch}
                  />
                }
              >
                <GroupMenu
                  data={searchText ? result : this.props.filters}
                  onItemSelect={this.onGroupFilterSelect}
                />
              </DropdownMenu>
            </div>
          </div>
          <div id="filters-container" className="fluid-6">
            <DropdownMenu
              useClick
              trigger={
                <span className="col-trigger">
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
          <div className="fluid-8">
            {
              this.props.selectedFilters.map(filter =>
                <div>
                  { filter.label }
                  {
                    filter.options
                      .filter(option => option.selected)
                      .map(option => <div>{ option.label }</div>)
                  }
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const isEnabled = group => {
    let enabled = false;

    if (group.selected) {
      group.options.forEach(option => {
        if (!enabled && option.selected) {
          enabled = true;
        }
      });
    }

    return enabled;
  };

  return {
    filters: state.filters,
    selectedFilters: state.filters.filter(isEnabled),
  };
};

export default connect(
  mapStateToProps
)(RecipeFilters);
