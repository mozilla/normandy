import React, { PropTypes as pt } from 'react';
import { Link } from 'react-router';
import Breadcrumbs from 'react-breadcrumbs';

export default function Header({
  pageType: { ctaButtons },
  currentLocation,
  routes,
  params,
  user,
}) {
  let ctaBtns;
  if (ctaButtons) {
    ctaBtns = ctaButtons.map(({ text, icon, link }, index) =>
      <Link className="button" to={currentLocation + link} key={index}>
        <i className={`pre fa fa-${icon}`} /> {text}
      </Link>
    );
  }

  return (
    <div>
      <div id="header">
        <h1><Link to={'/control/'}>Shield Control Panel</Link></h1>
        <ul>
          <li>{user.username}</li>
          <li><a href="/control/logout">Log Out <i className="fa fa-sign-out post" /></a></li>
        </ul>
      </div>

      <div id="page-header">
        <h2>
          <Breadcrumbs
            routes={routes}
            params={params}
            displayMissing={false}
            hideNoPath
            separator={<i className="fa fa-chevron-right" />}
          />
        </h2>
        {ctaBtns}
      </div>
    </div>
  );
}
Header.propTypes = {
  pageType: pt.object.isRequired,
  currentLocation: pt.string.isRequired,
  routes: pt.array.isRequired,
  params: pt.object.isRequired,
  user: pt.object.isRequired,
};
