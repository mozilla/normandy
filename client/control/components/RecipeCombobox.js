import React, { PropTypes as pt } from 'react';
import DropdownMenu from 'control/components/DropdownMenu';
import GroupMenu from 'control/components/GroupMenu';

export default class RecipeCombobox extends React.Component {
  static propTypes = {
    availableFilters: pt.array.isRequired,
    onGroupFilterSelect: pt.func.isRequired,
    updateSearch: pt.func.isRequired,
    searchText: pt.string,
  };

  static removeProperties(object, list) {
    const newObject = { ...object };

    list.forEach(property => {
      delete newObject[property];
    });

    return newObject;
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  searchGroup(group, search) {
    // remove 'meta' properties the user doesn't actually
    // want to search over
    const groupProperties = RecipeCombobox.removeProperties(group,
      ['value', 'selected', 'multiple']);

    // remove properties user doesnt care to search over
    groupProperties.options = groupProperties.options.map(option =>
      RecipeCombobox.removeProperties(option, [
        option.label ? 'value' : 'label',
        'selected',
        'multiple',
      ]));

    // quick and dirty 'deep object search'
    const groupString = JSON.stringify(groupProperties).toLowerCase();
    const groupSearch = (search || '').toLowerCase();

    return groupString.indexOf(groupSearch) > -1;
  }

  filterGroups(groups, search) {
    return groups.filter(group => this.searchGroup(group, search));
  }

  render() {
    const {
      availableFilters,
      searchText,
      onGroupFilterSelect,
      updateSearch,
    } = this.props;

    let result;

    // if the user has typed in text,
    // filter the remaining options
    if (searchText) {
      result = this.filterGroups(availableFilters, searchText);
    }

    return (
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
            searchText={searchText}
            data={searchText ? result : availableFilters}
            onItemSelect={onGroupFilterSelect}
          />
        </DropdownMenu>
      </div>
    );
  }
}
