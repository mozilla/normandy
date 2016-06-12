import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import controlStore from './stores/ControlStore.js';
import ControlAppRoutes from './routes.js';

import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'

const store = controlStore({
  controlApp: {
    recipes: null,
    isFetching: false,
    selectedRecipe: null,
    recipeListNeedsFetch: true,
    notification: null
  }
});

const history = syncHistoryWithStore(browserHistory, store);

class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Router history={history}>
          {ControlAppRoutes}
        </Router>
      </Provider>
    );
  }
}

ReactDOM.render(<Root />, document.querySelector('#page-container'));
