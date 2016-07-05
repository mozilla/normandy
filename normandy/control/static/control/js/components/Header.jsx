import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Breadcrumbs from 'react-breadcrumbs';

export default function Header({ pageType, currentLocation, routes, params }) {
  const { pageTitle, subTitle, ctaButtons } = pageType;

  let ctaBtns;
  if (ctaButtons) {
    ctaBtns = ctaButtons.map(({ text, icon, link }, index) =>
      <Link className="button" to={currentLocation + link} key={index}>
        <i className={'pre fa fa-' + icon}></i> {text}
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
          separator={<i className="fa fa-chevron-right"></i>}
        />
      </h2>
      {ctaBtns}
    </div>
  );
}
