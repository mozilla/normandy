import { List } from 'immutable';

import { DEFAULT_EXTENSION_LISTING_COLUMNS } from 'control_new/state/constants';


export function getExtension(state, id, defaultsTo = null) {
  return state.app.extensions.items.get(id, defaultsTo);
}

export function getExtensionListingCount(state) {
  return state.app.extensions.listing.get('count');
}

export function getExtensionPageCount(state, defaultsTo = 0) {
  return state.app.extensions.listing.get('numPages', defaultsTo);
}

export function getAllLoadedExtensions(state) {
  return state.app.extensions.listing.get('all', new List());
}

export function getExtensionListing(state) {
  const extensions = state.app.extensions.listing.get('results', new List([]));
  return extensions.map(id => getExtension(state, id));
}


export function getExtensionListingPageNumber(state) {
  return state.app.extensions.listing.get('pageNumber');
}


export function getExtensionListingColumns(
  state,
  defaultsTo = DEFAULT_EXTENSION_LISTING_COLUMNS,
) {
  return state.app.extensions.listing.get('columns', defaultsTo);
}
