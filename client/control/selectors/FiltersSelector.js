const isGroupSelected = group => {
  let enabled = false;

  if (group.selected) {
    let enabledOptions = 0;

    group.options.forEach(option => {
      if (option.selected) {
        enabledOptions += 1;

        // if this group only allows one option,
        if (!group.multiple) {
          // we can declare this enabled
          enabled = true;
        } else {
          // check if we hit the ceiling for options
          enabled = enabledOptions >= group.options.length;
        }
      }
    });
  }
  return enabled;
};

export const getSelectedFilters = groups => groups.filter(isGroupSelected);
// const getUnselectedFilters = groups => groups.filter(!isGroupSelected);

export const getAvailableFilterOptions = groups => {
  let newGroups = [].concat(groups || []);

  newGroups = newGroups.map(group => {
    if (group.selected && group.multiple) {
      const newOptions = group.options.filter(option => !option.selected);
      group.options = newOptions;
    }

    return group;
  });

  return newGroups;
};

export const getActiveFilters = groups =>
  [].concat(groups || [])
    .map(group => {
      if (!group.selected) {
        return null;
      }
      const newGroup = { ...group };
      // remove disabled filters
      const activeOptions = [].concat(group.options).filter(option => option.selected);
      newGroup.options = activeOptions;

      console.log('asdf', JSON.stringify(newGroup));
      return newGroup;
    }).filter(x => x);
