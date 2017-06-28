import React from 'react';
import PropTypes from 'prop-types';
import autobind from 'autobind-decorator';
import { connect } from 'react-redux';
import { Breadcrumb } from 'antd';
import { Link } from 'redux-little-router';

@autobind
export class NavigationCrumbs extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };
  state = { breadcrumbs: [] };

  componentDidMount() {
    this.updateBreadcrumbs(this.props.router);
  }

  componentWillReceiveProps({ router }) {
    this.updateBreadcrumbs(router || this.props.router);
  }

  // Given a router, gathers the steps leading down to the current route, to be
  // displayed as breadcrumbs.
  updateBreadcrumbs(router) {
    const { result, pathname } = router;

    const crumbs = [];
    let currentRoute = result;

    // Walk up route tree until there are no more `parent`s.
    while (currentRoute) {
      crumbs.push({
        name: currentRoute.crumb,
        link: currentRoute.route || pathname,
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
          <Breadcrumb.Item key={idx}>
            <Link href={crumb.link}>{ crumb.name }</Link>
          </Breadcrumb.Item>
        )}
      </Breadcrumb>
    );
  }
}

export default connect(
  state => ({
    router: state.router,
  }),
  null,
)(NavigationCrumbs);
