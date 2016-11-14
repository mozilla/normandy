import React, { PropTypes as pt } from 'react';
import Header from 'components/Header';
import Notifications from 'components/Notifications';
import DevTools from 'components/DevTools';

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
