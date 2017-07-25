import { Breadcrumb } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

@connect(
  state => ({
    router: state.router,
  }),
)
@autobind
export default class NavigationCrumbs extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };
  state = { breadcrumbs: [] };

  // Given a route (e.g. `/hello/:id/there`), finds params that need to be
  // populated (e.g. `:id`) and replaces the values in order to link correctly
  // when displayed as a Breadcrumb.
  static replaceUrlVariables(url, params) {
    let newUrl = url;
    const urlParams = url.match(/:[a-z]+/gi);

    if (urlParams) {
      urlParams.forEach(piece => {
        // Replace the found identifier with whatever the actual param is set to
        newUrl = newUrl.replace(piece, params[piece.slice(1)]);
      });
    }

    return newUrl;
  };

  componentDidMount() {
    this.gatherBreadcrumbs(this.props.router);
  }

  componentWillReceiveProps({ router }) {
    this.gatherBreadcrumbs(router || this.props.router);
  }

  gatherBreadcrumbs(router) {
    const { result, pathname, params } = router;

    const crumbs = [];
    let currentRoute = result;

    // Walk up route tree until there are no more `parent`s.
    while (currentRoute) {
      crumbs.push({
        name: currentRoute.crumb,
        link: NavigationCrumbs.replaceUrlVariables(currentRoute.route || pathname, params),
      });

      currentRoute = currentRoute.parent;
    }

    this.setState({
      breadcrumbs: crumbs.reverse(),
    });
  }

  render() {
    const { breadcrumbs } = this.state;

    return (
      <Breadcrumb>
        {breadcrumbs.map((crumb, idx) =>
          (<Breadcrumb.Item key={idx}>
            <Link href={crumb.link}>{ crumb.name }</Link>
          </Breadcrumb.Item>),
        )}
      </Breadcrumb>
    );
  }
}
