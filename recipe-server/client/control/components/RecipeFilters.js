import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'underscore';

import ColumnMenu from 'control/components/ColumnMenu';
import ActiveFilters from 'control/components/ActiveFilters';
import RecipeCombobox from 'control/components/RecipeCombobox';

import {
  loadLocalColumns,
} from 'control/actions/ColumnActions';

import {
  loadFilters,
  selectFilter,
  resetFilters,
  loadFilteredRecipes,
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
export class RecipeFilters extends React.Component {
  static propTypes = {
    // connected
    selectedFilters: pt.array.isRequired,
    availableFilters: pt.array.isRequired,
    columns: pt.array.isRequired,
    loadLocalColumns: pt.func.isRequired,
    loadFilters: pt.func.isRequired,
    selectFilter: pt.func.isRequired,
    resetFilters: pt.func.isRequired,
    loadFilteredRecipes: pt.func.isRequired,
  };


  constructor(props) {
    super(props);
    this.state = {};

    this.handleAddFilter = ::this.handleAddFilter;
    this.handleRemoveFilter = ::this.handleRemoveFilter;
    this.resetFilters = ::this.resetFilters;
  }


  /**
   * Loads user's last column display setup,
   * as well as their last active list filters.
   *
   * @return {void}
   */
  componentWillMount() {
    // load the last column setup user was viewing
    this.props.loadLocalColumns();
    this.props.loadFilters();
  }

  componentWillReceiveProps({ selectedFilters }) {
    if (!isEqual(selectedFilters, this.props.selectedFilters)) {
      this.props.loadFilteredRecipes();
    }
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
  handleAddFilter(group, option) {
    const filterGroup = typeof group === 'object' ?
      group : { value: group };

    this.props.selectFilter({
      group: filterGroup,
      option,
      // if this handler is fired, we know the user is
      // ADDING the filter - it's removed later
      isEnabled: true,
    });
  }

  /**
   * User has clicked on an individual filter/option
   * in order to deactivate it. Basically calls a
   * select filter action with `isEnabled` set to `false`
   *
   * @param  {Object} group  Relevant group that was updated
   * @param  {Object} option Relevant option that was removed
   * @return {void}
   */
  handleRemoveFilter(group, option) {
    this.props.selectFilter({
      group,
      option,
      isEnabled: false,
    });
  }

  /**
   * Simple helper to dispatch a 'reset filters' action.
   *
   * @return {void}
   */
  resetFilters() {
    this.props.resetFilters();
  }


  render() {
    const {
      availableFilters,
      columns,
    } = this.props;

    return (
      <div className="fluid-8">
        <div id="secondary-header" className="fluid-8">
          <div className="header-search fluid-2">
            <RecipeCombobox
              onFilterSelect={this.handleAddFilter}
              availableFilters={availableFilters}
            />
          </div>

          <div id="filters-container" className="fluid-6">
            <ColumnMenu
              columns={columns}
              onColumnChange={this.handleColumnInput}
            />
          </div>

          <ActiveFilters
            className="fluid-8"
            selectedFilters={this.props.selectedFilters}
            onResetFilters={this.resetFilters}
            onFilterSelect={this.handleRemoveFilter}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  // use selectors to pull specific store data
  selectedFilters: getSelectedFilterGroups(state.filters),
  availableFilters: getAvailableFilters(state.filters),
  // columns
  columns: state.columns,
});

const mapDispatchToProps = {
  loadFilters,
  loadLocalColumns,
  selectFilter,
  resetFilters,
  loadFilteredRecipes,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RecipeFilters);
