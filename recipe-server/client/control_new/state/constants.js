import { List, Map } from 'immutable';


export const DEFAULT_EXTENSION_LISTING_COLUMNS = new List([
  'name',
]);

export const DEFAULT_RECIPE_LISTING_COLUMNS = new List([
  'name',
  'action',
  'enabled',
  'lastUpdated',
]);

export const DEFAULT_REQUEST = new Map({
  inProgress: false,
  error: null,
});

export const RECIPE_LISTING_COLUMNS = new List([
  'name',
  'action',
  'enabled',
  'lastUpdated',
]);

export const REVISION_APPROVED = 'REVISION_APPROVED';
export const REVISION_DISABLED = 'REVISION_DISABLED';
export const REVISION_DRAFT = 'REVISION_DRAFT';
export const REVISION_LIVE = 'REVISION_LIVE';
export const REVISION_OUTDATED = 'REVISION_OUTDATED';
export const REVISION_PENDING_APPROVAL = 'REVISION_PENDING_APPROVAL';
export const REVISION_REJECTED = 'REVISION_REJECTED';

export const EXTENSION_LISTING_COLUMNS = new List([
  'name',
  'xpi',
]);
