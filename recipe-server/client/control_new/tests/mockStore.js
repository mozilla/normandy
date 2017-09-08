import React from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';

import reducers from 'control_new/state';

export function createMockStore() {
  return createStore(
    reducers,
    reducers(undefined, { type: 'initial' }),
    compose(applyMiddleware(thunk)),
  );
}

export function wrapMockStore(element) {
  return (
    <Provider store={createMockStore()}>
      { element }
    </Provider>
  );
}
