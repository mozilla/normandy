export function getExtension(state, id, defaultsTo = null) {
  return state.newState.extensions.items.get(id, defaultsTo);
}


export function getAllExtensions(state) {
  return state.newState.extensions.items;
}
