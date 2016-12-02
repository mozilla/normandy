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
  resetFilters,
} from 'control/actions/FilterActions';
import {
  getSelectedFilterGroups,
  getAvailableFilters,
} from 'control/selectors/FiltersSelector';

/**
 * Filters displayed above the RecipeList table.
 *
 * Contains the big filter combobox, the 'active filters' section,
 * and the column menu.
 */
class RecipeFilters extends React.Component {
  static propTypes = {
    searchText: pt.string.isRequired,
    updateSearch: pt.func.isRequired,
    onFilterChange: pt.func.isRequired,
    displayCount: pt.number,
    totalCount: pt.number,
    // connected
    dispatch: pt.func.isRequired,
    filters: pt.array.isRequired,
    selectedFilters: pt.array.isRequired,
    availableFilters: pt.array.isRequired,
  };


  // This is the basic settings for the RecipeList columns
  // #TODO abstract this out, possibly into ColumnMenu
  // #TODO this should probably be its own store
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

    // we basically need to handle a change in order
    // for the parent to be notified of what columns are available
    // #TODO (this could be avoided by using a store for columns)
    this.handleFilterChange(true);
  }


  /**
   * Loads user's last column display setup,
   * as well as their last active list filters.
   *
   * @return {void}
   */
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


  /**
   * User has selected a filter option from the
   * combobox dropdown. This handler simply fires
   * the redux action to SET_FILTER.
   *
   * @param  {Object} group  Parent group of selected option
   * @param  {Object} option Selected option
   * @return {void}
   */
  handleGroupFilterSelect(group, option) {
    this.props.dispatch(selectFilter({
      group,
      option,
      // if this handler is fired, we know the user is
      // ADDING the filter - it's removed later
      isEnabled: true,
    }));
  }

  /**
   * User has de/activated a column. This handler
   * simply updates the component's column state,
   * and notifies the parent of what's selected
   *
   * Note: it seems a little fragile to use the index for this,
   * may be useful to switch to something more identifying.
   *
   * @param  {Number}  columnIndex Integer, index of relevant column
   * @param  {Boolean} isActive    Is the column now active?
   * @return {void}
   */
  handleColumnInput(columnIndex, isActive) {
    const newColumns = [].concat(this.state.columns || []);
    newColumns[columnIndex].enabled = isActive;

    // update local state
    // #TODO this could be replaced by an action..
    this.setState({
      columns: newColumns,
    });

    // #TODO (cnt'd) ..which would make this unnecessary
    this.handleFilterChange();
  }

  /**
   * Utility function to save column state
   * via localForage (which is asynchronous).
   *
   * @return {void}
   */
  saveColumnState() {
    localForage.setItem('columns', this.state.columns);
  }

  /**
   * For each column, determine which is 'enabled' (showing)
   * and then sends an array of visible columns up to props.onFilterChange.
   *
   * Automatically saves column data locally, unless `true` param is passed in.
   *
   * @param  {Boolean} dontSave Prevent column data from being stored locally
   * @return {void}
   */
  handleFilterChange(dontSave) {
    const {
      columns,
    } = this.state;

    // get only the selected columns
    const selected = [].concat(columns)
      .map(col => (col.enabled ? col : null))
      .filter(col => col);

    // in general, we want to save all the time
    // EXCEPT when we first start up and load saved data
    if (!dontSave) {
      this.saveColumnState();
    }

    // send the array of selected/active columns to the parent
    this.props.onFilterChange(selected);
  }

  /**
   * Simple helper to dispatch a 'reset filters' action.
   *
   * @return {void}
   */
  resetFilters() {
    this.props.dispatch(resetFilters());
  }

  /**
   * Render
   */
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
              // #TODO this shouldn't be an anon fn
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
  // use selectors to pull specific store data
  selectedFilters: getSelectedFilterGroups(state.filters),
  availableFilters: getAvailableFilters(state.filters),
});

export default connect(
  mapStateToProps
)(RecipeFilters);
