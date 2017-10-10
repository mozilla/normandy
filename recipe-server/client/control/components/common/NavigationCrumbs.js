import { Breadcrumb } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import { replaceUrlVariables } from 'control/routerUtils';

@connect(
  state => ({
    router: state.router,
  }),
)
@autobind
export default class NavigationCrumbs extends React.PureComponent {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };

  state = { breadcrumbs: [] };

  componentDidMount() {
    this.gatherBreadcrumbs(this.props.router);
  }

  componentWillReceiveProps({ router }) {
    this.gatherBreadcrumbs(router || this.props.router);
  }

  getCrumbSlug(crumb) {
    return crumb.name.toLowerCase().replace(/\s+/g, '-');
  }

  gatherBreadcrumbs(router) {
    const { result, pathname, params } = router;

    const crumbs = [];
    let currentRoute = result;

    // Walk up route tree until there are no more `parent`s.
    while (currentRoute) {
      if (currentRoute.crumb) {
        crumbs.push({
          name: currentRoute.crumb,
          link: replaceUrlVariables(currentRoute.route || pathname, params),
        });
      }

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
            <Link href={crumb.link} id={this.getCrumbSlug(crumb)}>{ crumb.name }</Link>
          </Breadcrumb.Item>),
        )}
      </Breadcrumb>
    );
  }
}
