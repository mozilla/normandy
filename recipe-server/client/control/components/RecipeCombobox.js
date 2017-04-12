import React, { PropTypes as pt } from 'react';

import { omit } from 'underscore';

import DropdownMenu from 'control/components/DropdownMenu';
import GroupMenu from 'control/components/GroupMenu';

/**
 * Text/dropdown combobox displayed in RecipeFilters.
 * Used to display and search over filter options
 * based on user input.
 */
export default class RecipeCombobox extends React.Component {
  static propTypes = {
    availableFilters: pt.array.isRequired,
    onFilterSelect: pt.func.isRequired,
  };

  /**
   * Constructor
   */
  constructor(props) {
    super(props);

    this.state = {
      searchText: '',
    };

    this.updateSearch = ::this.updateSearch;
    this.handleFilterSelect = ::this.handleFilterSelect;
  }

  /**
   * Given a set of filter groups + options, and a search text value,
   * returns a set of filters in which the search value is found.
   *
   * Certain properties are NOT searched over, such as `value`,
   * `selected`, and `multiple` - this would allow for searching
   * the words 'true' or 'false' to return hits incorrectly.
   *
   * @param  {Array<Object>} groups   Array of filter groups/options to search
   * @param  {string}        search   Text value to find in the filter groups
   * @return {Array<Object>} Array of filter groups containing search value
   */
  filterGroups(groups, search) {
    const searchText = (search || '').toLowerCase();

    this.filterCache = this.filterCache || {};
    const cacheKey = `${Object.keys(groups).join(',')}::${searchText}`;
    if (this.filterCache[cacheKey]) {
      return this.filterCache[cacheKey];
    }

    const searchRegex = new RegExp(searchText, 'ig');

    const containsSearch = obj =>
      !!Object.keys(obj)
        .find(key => searchRegex.test(obj[key]));

    const filteredGroups = []
      .concat(groups)
      .map(group => {
        const newGroup = { ...group };

        // remove properties user doesnt care to search over
        newGroup.options = newGroup.options.filter(option => {
          const newOption = omit({ ...option }, [
            // if an option has a label,
            // remove the hidden value
            option.label ? 'value' : 'label',
            'selected',
            'multiple',
          ]);

          return containsSearch(newOption);
        });


        return newGroup.options.length ? newGroup : null;
      })
      .filter(x => x);

    this.filterCache[cacheKey] = filteredGroups;

    return filteredGroups;
  }

  /**
   * Resets the text field input, blurs the input,
   * and updates the 'searchText' state.
   *
   * Fired after user selects a filter option or enters
   * a text filter.
   */
  clearInput() {
    this.setState({
      searchText: '',
    });

    if (this.inputRef) {
      this.inputRef.value = '';
    }
  }

  /**
   * Key event handler for text field. Updates local
   * searchText state. Also detects if user
   * has hit the ENTER key, and if so, will update activated
   * filters to include this text search.
   *
   * @param  {node}   options.target  Event target
   * @param  {string} options.keyCode Keyboard event key code
   */
  updateSearch({ target, keyCode }) {
    // Enter key
    if (typeof keyCode !== 'undefined' && keyCode === 13) {
      this.props.onFilterSelect('text', target.value);

      this.clearInput();
    } else {
      this.setState({
        searchText: target.value,
      });
    }
  }

  /**
   * Handler for user selecting a filter to enable.
   * Basically clears the input field and then fires
   * the parent onFilterSelect prop.
   *
   * @param  {Object} group  Filter group that was activated
   * @param  {Object} option Filter option that was activated
   */
  handleFilterSelect(group, option) {
    this.clearInput();
    return this.props.onFilterSelect(group, option);
  }


  render() {
    const {
      availableFilters,
    } = this.props;

    const {
      searchText,
    } = this.state;

    // if we have search text,
    // use that to filter out the option groups
    const result = searchText && this.filterGroups(availableFilters, searchText);

    const filterOptions = searchText ? result : availableFilters;

    return (
      <div className="search input-with-icon">
        <DropdownMenu
          useFocus
          disabled={!searchText && filterOptions.length === 0}
          trigger={
            <input
              type="text"
              placeholder="Search"
              defaultValue={searchText}
              onKeyUp={this.updateSearch}
              onChange={this.updateSearch}
              ref={input => { this.inputRef = input; }}
            />
          }
        >
          <GroupMenu
            searchText={searchText}
            data={filterOptions}
            onItemSelect={this.handleFilterSelect}
          />
        </DropdownMenu>
      </div>
    );
  }
}
