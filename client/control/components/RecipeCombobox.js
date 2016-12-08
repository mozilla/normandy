import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import DropdownMenu from 'control/components/DropdownMenu';
import GroupMenu from 'control/components/GroupMenu';

/**
 * Text/dropdown combobox displayed in RecipeFilters.
 * Used to display and search over filter options
 * based on user input.
 */
class RecipeCombobox extends React.Component {
  static propTypes = {
    availableFilters: pt.array.isRequired,
    onFilterSelect: pt.func.isRequired,
    dispatch: pt.func.isRequired,
  };

  /**
   * Utility function to remove a set of properties
   * from a given object.
   *
   * @param  {Object}         object Object to remove props form
   * @param  {Array<string>}  list   List of properties to remove
   * @return {Object}         New object without selected properties
   */
  static removeProperties(object, list) {
    const newObject = { ...object };

    list.forEach(property => {
      delete newObject[property];
    });

    return newObject;
  }

  constructor(props) {
    super(props);

    this.state = {
      searchText: '',
    };

    this.updateSearch = ::this.updateSearch;
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
    return [].concat(groups).filter(group => {
      // remove 'meta' properties the user doesn't actually
      // want to search over
      const groupProperties = RecipeCombobox.removeProperties(group,
        ['value', 'selected', 'multiple']);

      // remove properties user doesnt care to search over
      groupProperties.options = groupProperties.options.map(option =>
        RecipeCombobox.removeProperties(option, [
          // if an option has a label,
          // remove the hidden value
          option.label ? 'value' : 'label',
          'selected',
          'multiple',
        ]));

      // quick and dirty 'deep object search'
      const groupString = JSON.stringify(groupProperties).toLowerCase();
      const groupSearch = (search || '').toLowerCase();

      return groupString.indexOf(groupSearch) > -1;
    });
  }

  clearInput() {
    this.setState({
      searchText: '',
    });

    if (this.inputRef) {
      this.inputRef.value = '';
    }
  }

  updateSearch({ target }) {
    this.setState({
      searchText: target.value,
    });
  }

  /**
   * Render
   */
  render() {
    const {
      availableFilters,
      onFilterSelect,
    } = this.props;

    const {
      searchText,
    } = this.state;

    // #TODO text filtering should work like other filters
    // if the user has typed in text, filter the remaining options
    const result = searchText && this.filterGroups(availableFilters, searchText);

    return (
      <div className="search input-with-icon">
        <DropdownMenu
          useFocus
          trigger={
            <input
              type="text"
              placeholder="Search"
              initialValue={searchText}
              onKeyUp={this.updateSearch}
              ref={input => { this.inputRef = input; }}
            />
          }
        >
          <GroupMenu
            searchText={searchText}
            data={searchText ? result : availableFilters}
            onItemSelect={onFilterSelect}
          />
        </DropdownMenu>
      </div>
    );
  }
}

const mapStateToProps = () => ({});
export default connect(
  mapStateToProps
)(RecipeCombobox);

