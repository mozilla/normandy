import { Map } from 'immutable';


export const INITIAL_STATE = {
  items: new Map(),
  listing: new Map(),
};


export const EXTENSION = {
  id: 1,
  name: 'test-extension',
  xpi: 'http://path.to/addon.xpi',
};
