import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Menu } from 'antd';
import { Link } from 'redux-little-router';

const { SubMenu, Item } = Menu;

export function NavigationMenu({ router }) {
  const { pathname, search } = router;

  return (
    <Menu
      defaultOpenKeys={['Recipes', 'Extensions']}
      selectedKeys={[pathname + search]}
      mode="inline"
    >
      <Item key="/"><Link href="/">Home</Link></Item>

      <SubMenu title="Recipes" key="Recipes">
        <Item key="/recipe">
          <Link href="/recipe">View All</Link>
        </Item>
        <Item key="/recipe?hearbeat">
          <Link href="/recipe?hearbeat">Heartbeat</Link>
        </Item>
        <Item key="/recipe?console-log">
          <Link href="/recipe?console-log">console-log</Link>
        </Item>
        <Item key="/recipe?pref-study">
          <Link href="/recipe?pref-study">Preference Study</Link>
        </Item>
      </SubMenu>

      <SubMenu title="Extensions" key="Extensions">
        <Item key="/extension">
          <Link href="/extension">View All</Link>
        </Item>
        <Item key="/extension?pref-study">
          <Link href="/extension?pref-study">Preference Study</Link>
        </Item>
      </SubMenu>
    </Menu>
  );
}

NavigationMenu.propTypes = {
  router: PropTypes.object.isRequired,
};


export default connect(
  state => ({
    router: state.router,
  }),
)(NavigationMenu);
