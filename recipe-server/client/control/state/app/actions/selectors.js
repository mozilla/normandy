export function getAction(state, id, defaultsTo = null) {
  // Convert string IDs to integers, since the state is keyed by ints.
  let intId = id;
  if (!Number.isInteger(intId)) {
    intId = Number.parseInt(id, 10);
  }

  return state.app.actions.items.get(intId, defaultsTo);
}

export function getActionByName(state, name, defaultsTo = null) {
  for (const action of state.app.actions.items.values()) {
    if (action.get('name') === name) {
      return action;
    }
  }
  return defaultsTo;
}

export function getAllActions(state) {
  return state.app.actions.items;
}
