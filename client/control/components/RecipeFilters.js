import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';
import { connect } from 'react-redux';

import ColumnMenu from 'control/components/ColumnMenu';
import ActiveFilters from 'control/components/ActiveFilters';
import RecipeCombobox from 'control/components/RecipeCombobox';
import RecipeCount from 'control/components/RecipeCount';

import {
  selectFilter,
  setAllFilters,
} from 'control/actions/FilterActions';
import {
  getSelectedFilterGroups,
  getAvailableFilters,
} from 'control/selectors/FiltersSelector';

class RecipeFilters extends React.Component {
  static propTypes = {
    searchText: pt.string.isRequired,
    updateSearch: pt.func.isRequired,
    onFilterChange: pt.func.isRequired,
    // connected
    filters: pt.array.isRequired,
    selectedFilters: pt.array.isRequired,
    availableFilters: pt.array.isRequired,
    dispatch: pt.func.isRequired,
    displayCount: pt.number,
    totalCount: pt.number,
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
    this.handleGroupFilterSelect = ::this.handleGroupFilterSelect;
    this.resetFilters = ::this.resetFilters;

    this.handleFilterChange(true);
  }

  componentWillMount() {
    // load the column settings the user last used
    localForage.getItem('columns', (err, found) => {
      this.setState({
        columns: found || RecipeFilters.defaultColumnConfig,
      });
      this.handleFilterChange(true);
    });

    // load the last filters the user viewed
    localForage.getItem('last-filters', (err, found) => {
      if (!err && found) {
        this.props.dispatch(setAllFilters(found));
      }
    });
  }

  handleGroupFilterSelect(group, option) {
    this.props.dispatch(selectFilter({
      group,
      option,
      isEnabled: true,
    }));
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

  resetFilters() {
    this.props.dispatch(setAllFilters());
  }

  render() {
    const {
      searchText,
      updateSearch,
      displayCount,
      totalCount,
      availableFilters,
    } = this.props;

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search" className="fluid-2">
            <RecipeCombobox
              searchText={searchText}
              updateSearch={updateSearch}
              onGroupFilterSelect={this.handleGroupFilterSelect}
              availableFilters={availableFilters}
            />
          </div>

          <div id="filters-container" className="fluid-6">
            <RecipeCount
              displayCount={displayCount}
              totalCount={totalCount}
              isFiltering={this.props.selectedFilters.length > 0}
            />
            <ColumnMenu
              columns={this.state.columns}
              onColumnChange={this.handleColumnInput}
            />
          </div>

          <ActiveFilters
            className="fluid-8"
            selectedFilters={this.props.selectedFilters}
            onResetFilters={this.resetFilters}
            onFilterSelect={({ group, option }) => {
              this.props.dispatch(selectFilter({
                group,
                option,
                isEnabled: false,
              }));
            }}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  filters: state.filters,
  selectedFilters: getSelectedFilterGroups(state.filters),
  availableFilters: getAvailableFilters(state.filters),
});

export default connect(
  mapStateToProps
)(RecipeFilters);
