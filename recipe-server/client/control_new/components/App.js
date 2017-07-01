import { Layout, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'redux-little-router';

import NavigationCrumbs from 'control_new/components/common/NavigationCrumbs';
import NavigationMenu from 'control_new/components/common/NavigationMenu';

const { Content, Header, Sider } = Layout;

export default function App({ children }) {
  return (
    <LocaleProvider locale={enUS}>
      <Layout>
        <Header>
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

App.propTypes = {
  children: PropTypes.any,
};
