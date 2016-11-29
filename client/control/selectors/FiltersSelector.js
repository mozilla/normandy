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

export const getSelectedFilters = groups => groups.filter(isGroupSelected);

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
      const activeOptions = [].concat(group.options).filter(option => !option.selected);
      newGroup.options = activeOptions;

      return newGroup.options.length === 0 ? null : newGroup;
    }).filter(x => x);
