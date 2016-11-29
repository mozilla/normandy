const isGroupSelected = group => {
  let enabled = false;

  if (group.selected) {
    group.options.forEach(option => {
      if (option.selected) {
        enabled = true;
      }
    });
  }

  return enabled;
};

export const getSelectedFilterGroups = groups => groups.filter(isGroupSelected);

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

      return newGroup;
    }).filter(x => x);


export const getAvailableFilters = groups =>
  [].concat(groups || [])
    .map(group => {
      const newGroup = { ...group };
      // remove enabled filters
      let availableOptions = [].concat(group.options).filter(option => !option.selected);
      const activeOptions = [].concat(group.options).filter(option => option.selected);

      // if there is at least one option selected,
      // and this group DOES not allow multiples,
      if (activeOptions.length > 0 && !newGroup.multiple) {
        // wipe the rest of the options
        // (this will prevent it from appearing in menus later)
        availableOptions = [];
      }

      newGroup.options = availableOptions;

      // if there are no options left, just remove this group from the list
      return newGroup.options.length === 0 ? null : newGroup;
    }).filter(x => x);
