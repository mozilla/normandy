import React, { Component, PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Breadcrumbs from 'react-breadcrumbs';
import QueryAPIToken from './data/QueryAPIToken.js';

function Header({
  pageType: { ctaButtons },
  currentLocation,
  routes,
  params,
  user,
  token,
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
          <li><APITokenExpander token={token} /></li>
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
  token: pt.shape({ key: pt.string.isRequired }),
  user: pt.object.isRequired,
};

export default connect(
  (state, ownProps) => ({
    ...ownProps,
    token: state.auth.token,
  }),
)(Header);


class APITokenExpander extends Component {
  static propTypes = {
    token: pt.shape({ key: pt.string }),
  };

  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.toggleExpand = ::this.toggleExpand;
  }

  toggleExpand() {
    this.setState(state => ({ ...state, expanded: !state.expanded }));
  }

  render() {
    const { token } = this.props;
    const { expanded } = this.state;

    const expandButton = (
      <button className="button-icon" onClick={this.toggleExpand}>
        <i className="fa fa-gear fa-lg" />
      </button>
    );

    if (expanded) {
      return (
        <span>
          <QueryAPIToken />
          {token && `API Key: ${token.key}`}
          {expandButton}
        </span>
      );
    }
    return (
      <span>
        {expandButton}
      </span>
    );
  }
}
