import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';
import { connect } from 'react-redux';

import ColumnMenu from 'control/components/ColumnMenu';
import ActiveFilters from 'control/components/ActiveFilters';
import RecipeCombobox from 'control/components/RecipeCombobox';
import RecipeCount from 'control/components/RecipeCount';


import {
  setColumns,
} from 'control/actions/ColumnActions';

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
    displayCount: pt.number,
    totalCount: pt.number,
    // connected
    dispatch: pt.func.isRequired,
    filters: pt.array.isRequired,
    selectedFilters: pt.array.isRequired,
    availableFilters: pt.array.isRequired,
    columns: pt.array.isRequired,
  };


  constructor(props) {
    super(props);
    this.state = {};

    this.handleGroupFilterSelect = ::this.handleGroupFilterSelect;
    this.resetFilters = ::this.resetFilters;
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
      if (!err && found && found.length) {
        this.props.dispatch(setColumns(found));
      }
    });

    // load the last filters the user viewed
    localForage.getItem('last-filters', (err, found) => {
      if (!err && found && found.length) {
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
      displayCount,
      totalCount,
      availableFilters,
      columns,
    } = this.props;

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search" className="fluid-2">
            <RecipeCombobox
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
              columns={columns}
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
  // columns
  columns: state.columns,
});

export default connect(
  mapStateToProps
)(RecipeFilters);
