import React from 'react';
import { Route } from 'react-router';
import ControlApp from './components/ControlApp.jsx';

export default (
  <Route>
    <Route path='control' component={ControlApp} />
  </Route>
);
