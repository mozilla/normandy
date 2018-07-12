import { Layout, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'redux-little-router';

import CurrentUserDetails from 'control/components/common/CurrentUserDetails';
import NavigationCrumbs from 'control/components/common/NavigationCrumbs';
import NavigationMenu from 'control/components/common/NavigationMenu';
import DeprecationAlert from 'control/components/common/DeprecationAlert';
import EnvAlert from 'control/components/common/EnvAlert';
import QueryActions from 'control/components/data/QueryActions';
import QueryServiceInfo from 'control/components/data/QueryServiceInfo';

const { Content, Header, Sider } = Layout;


export default class App extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    const { children } = this.props;

    return (
      <LocaleProvider locale={enUS}>
        <Layout>
          <DeprecationAlert />
          <EnvAlert />

          {/*
           Global query components; add any queries for data needed across the
           entire app that we only need to fetch once.
           */}
          <QueryActions />
          <QueryServiceInfo />

          <Header>
            <CurrentUserDetails />
            <div className="logo">
              <Link href="/">SHIELD Control Panel</Link>
            </div>
          </Header>

          <Layout>
            <Sider
              className="sidebar"
              breakpoint="sm"
              collapsedWidth="0"
            >
              <NavigationMenu />
            </Sider>

            <Layout className="content-wrapper">
              <NavigationCrumbs />

              <Content className="content">
                {children}
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </LocaleProvider>
    );
  }
}
