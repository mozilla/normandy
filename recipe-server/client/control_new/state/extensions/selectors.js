export function getExtension(state, id, defaultsTo = null) {
  return state.app.extensions.items.get(id, defaultsTo);
}


export function getAllExtensions(state) {
  return state.app.extensions.items;
}
