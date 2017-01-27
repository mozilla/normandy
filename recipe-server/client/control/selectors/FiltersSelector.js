/**
 * Filter selectors
 *
 * Basically a set of helper functions to apply to a store when connecting with redux.
 * This simplifies in-view logic - no more .maps or .filters in mapStateToProps!
 */

import cloneArrayValues from 'client/utils/clone-array';

/**
 * Given a group, determines if any option has been selected
 * somewhere within it.
 *
 * @param  {Object} group Group to detect options in
 * @return {Boolean}       Does the group have a selected option?
 */
const isGroupSelected = group => {
  let enabled = false;

  if (group.selected) {
    group.options.forEach(option => {
      enabled = enabled || option.selected;
    });
  }

  return enabled;
};


/**
 * Given a set of groups, returns only those with selected options.
 *
 * @param  {Array<Object>} groups List of groups to find selected options within
 * @return {Array<Object>}        Filtered groups with at least one selected option
 */
export const getSelectedFilterGroups = state => state.active.filter(isGroupSelected);


/**
 * Given a set of groups, finds the selected groups,
 * and then removes any NON-selected options.
 *
 * Essentially, returns an array of groups and their selected options.
 *
 * @param  {Array<Object>} groups All possible filter groups
 * @return {Array<Object>}        Active filter groups and their selected options
 */
export const getActiveFilters = state =>
  cloneArrayValues(state.active)
    .map(group => {
      // group has no selection = remove it
      if (!group.selected) {
        return null;
      }

      const newGroup = { ...group };
      // remove non-selected filters
      const activeOptions = cloneArrayValues(group.options).filter(option => option.selected);
      newGroup.options = activeOptions;

      return newGroup;
      // filtering x=>x will remove any null array members
      // (e.g. [1,null,2] becomes [1,2])
    }).filter(x => x);


/**
 * Given a set of groups, finds the activated groups and options,
 * and then creates a query string with all selected values.
 *
 * @param  {Array<Object>} groups All possible filter groups
 * @return {string}        URL-safe query param string
 */
export const getFilterParamString = state =>
  getActiveFilters(state)
    .map(group => {
      const param = group.value;
      const selected = [];

      group.options.forEach(option => {
        if (option.selected) {
          selected.push(option.value);
        }
      });

      return `${param}=${selected.map(encodeURIComponent).join(',')}`;
    })
    .join('&');

/**
 * Given a set of groups, returns only the groups/options that
 * are available for selection. Non-multiple options will be excluded
 * entirely if an opposing option has already been selected.
 *
 * @param  {Array<Object>} groups Array of option group objects
 * @return {Array<Object>}        Array of non-selected options/groups
 */
export const getAvailableFilters = state =>
  cloneArrayValues(state.active)
    .map(group => {
      const newGroup = { ...group };

      // get the non/selected options
      let availableOptions = cloneArrayValues(group.options).filter(option => !option.selected);
      const activeOptions = cloneArrayValues(group.options).filter(option => option.selected);

      // if there is at least one option selected,
      // and this group DOES NOT allow multiples,
      if (activeOptions.length > 0 && !newGroup.multiple) {
        // wipe the rest of the options
        // (this will prevent it from appearing in menus later)
        availableOptions = [];
      }

      newGroup.options = availableOptions;

      // if there are no options left, just remove this group from the list
      return newGroup.options.length === 0 ? null : newGroup;
    })
    // finally, filter nulls out of the array
    .filter(x => x);

/**
 * Determines if any filters are activated.
 *
 * @param  {Array<Object>} groups All possible filter groups
 * @return {boolean}              Does user have at least one filter active?
 */
export const isFilteringActive = state =>
  getActiveFilters(state).length > 0;
