import React, { PropTypes as pt } from 'react';
import { Link } from 'react-router';
import { resolve } from 'path';
import Breadcrumbs from 'react-breadcrumbs';

export default function Header({ pageType: { ctaButtons }, currentLocation, routes, params }) {
  let ctaBtns;
  if (ctaButtons) {
    ctaBtns = ctaButtons.map(({ text, icon, link }, index) => {
      const buttonClass = `button ${text.toLowerCase()}`;
      const buttonLink = `${resolve(currentLocation, link)}/`;
      const iconClass = `pre fa fa-${icon}`;

      return (
        <Link className={buttonClass} to={buttonLink} key={index}>
          <i className={iconClass} /> {text}
        </Link>
      );
    });
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
