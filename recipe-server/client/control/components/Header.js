import React, { PropTypes as pt } from 'react';
import { Link } from 'react-router';
import Breadcrumbs from 'react-breadcrumbs';

import absolutePath from '../../utils/absolute-path';

export default function Header({ pageType: { ctaButtons }, currentLocation, routes, params }) {
  let ctaBtns;
  if (ctaButtons) {
    ctaBtns = ctaButtons.map(({ text, icon, link }, index) =>
      <Link className="button" to={absolutePath(currentLocation, link)} key={index}>
        <i className={`pre fa fa-${icon}`} /> {text}
      </Link>
    );
  }

  return (
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
  );
}
Header.propTypes = {
  pageType: pt.object.isRequired,
  currentLocation: pt.string.isRequired,
  routes: pt.array.isRequired,
  params: pt.object.isRequired,
};
