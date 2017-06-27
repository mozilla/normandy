import { Layout, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import React, { PropTypes as pt } from 'react';


const { Header, Content } = Layout;


export default function App({ children }) {
  return (
    <LocaleProvider locale={enUS}>
      <Layout>
        <Header>
          <h1>SHIELD Control Panel</h1>
        </Header>
        <Content className="content">
          {children}
        </Content>
      </Layout>
    </LocaleProvider>
  );
}

App.propTypes = {
  children: pt.any,
};
