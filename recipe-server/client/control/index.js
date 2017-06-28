import ReactDOM from 'react-dom';

import { createApp } from 'control/app';

// Initialize the control app and render it.
const app = createApp();
ReactDOM.render(
  app.rootComponent,
  document.querySelector('#page-container')
);
