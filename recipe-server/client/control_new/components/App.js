import { Breadcrumb, Layout, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import React, { PropTypes as pt } from 'react';


const { Content, Header, Sider } = Layout;


export default function App({ children }) {
  return (
    <LocaleProvider locale={enUS}>
      <Layout>
        <Header>
          <div className="logo">
            SHIELD Control Panel
          </div>
        </Header>

        <Layout>
          <Sider width={200} className="sidebar">
            Menu goes here.
          </Sider>

          <Layout className="content-wrapper">
            <Breadcrumb>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Breadcrumb>

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
  children: pt.any,
};
