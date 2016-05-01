import React from 'react'
import ReactDOM from 'react-dom'
import { Router, browserHistory } from 'react-router';
import routes from './routes';

import ControlApp from './components/ControlApp.jsx';

ReactDOM.render(<Router history={browserHistory}>{routes}</Router>, document.querySelector('#content'));
