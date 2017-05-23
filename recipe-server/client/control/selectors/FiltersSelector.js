/**
 * Filter selectors
 *
 * Basically a set of helper functions to apply to a store when connecting with redux.
 * This simplifies in-view logic - no more .maps or .filters in mapStateToProps!
 */

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
 * Given the current filter state, returns only those with selected options.
 *
 * @param  {Array<Object>} groups List of groups to find selected options within
 * @return {Array<Object>}        Filtered groups with at least one selected option
 */
export const getSelectedFilterGroups = state => state.active.filter(isGroupSelected);


/**
 * Given the current filter state, finds the selected groups,
 * and then removes any NON-selected options.
 *
 * Essentially, returns an array of groups and their selected options.
 *
 * @param  {Object}   state   Current filter state object
 * @return {Array<Object>}    Active filter groups and their selected options
 */
export const getActiveFilterOptions = (state = {}) =>
  [].concat(state.active || [])
    .map(group => {
      // group has no selection = remove it
      if (!group || !group.selected) {
        return null;
      }

      const newGroup = { ...group };
      // remove non-selected filters
      const activeOptions = [].concat(group.options)
        .filter(option => option.selected)
        .map(option => ({ ...option }));

      newGroup.options = activeOptions;

      return newGroup;
    }).filter(x => x);


/**
 * Given the current filter state, finds the activated groups and options,
 * and then creates a query string with all selected values.
 *
 * @param  {Object}   state   Current filter state object
 * @return {string}   URL-safe query param string
 */
export const getFilterParamString = state =>
  getActiveFilterOptions(state)
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
 * Given the current filter state, returns only the groups/options that
 * are available for selection. Non-multiple options will be excluded
 * entirely if an opposing option has already been selected.
 *
 * @param  {Object}   state   Current filter state object
 * @return {Array<Object>}    Array of non-selected options/groups
 */
export const getAvailableFilters = state =>
  [].concat(state.active)
    .map(group => {
      const newGroup = { ...group };

      // get the non/selected options
      let availableOptions = [].concat(group.options).filter(option => !option.selected);
      const activeOptions = [].concat(group.options).filter(option => option.selected);

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
 * @param  {Object}   state   Current filter state object
 * @return {boolean}              Does user have at least one filter active?
 */
export const isFilteringActive = state =>
  getActiveFilterOptions(state).length > 0;

/**
 * Get all filters as an object keyed on their slug
 *
 * @param  {Object}   state   Current filter state object
 * @return {Array<Object>}    List of filter objects.
 */
export const getFilterObject = state =>
  state.list.reduce((optionsMap, group) => {
    optionsMap[group.value] = group.options;
    return optionsMap;
  }, {});

