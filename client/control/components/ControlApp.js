import React, { PropTypes as pt } from 'react';
import Header from './Header.js';
import Notifications from './Notifications.js';
import DevTools from './DevTools.js';

export default function ControlApp({ children, location, routes, params }) {
  return (
    <div>
      {DEVELOPMENT && <DevTools />}
      <Notifications />
      <Header
        pageType={children.props.route}
        currentLocation={location.pathname}
        routes={routes}
        params={params}
      />
      <div id="content" className="wrapper">
        {
          React.Children.map(children, child => React.cloneElement(child))
        }
      </div>
    </div>
  );
}
ControlApp.propTypes = {
  children: pt.object.isRequired,
  location: pt.object.isRequired,
  routes: pt.array.isRequired,
  params: pt.object.isRequired,
};
