import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Menu } from 'antd';
import { Link } from 'redux-little-router';

const { SubMenu, Item } = Menu;

export class NavigationMenu extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };

  static menuList = {
    Home: '/',
    Recipes: {
      'View All': '/recipes',
      // These are just examples - later, the URLs will point to filtered listings.
      Heartbeat: '/recipes?heartbeat',
      'console-log': '/recipes?console-log',
      'Preference Study': '/recipes?pref-exp',
    },
    Extensions: {
      'View All': '/extensions',
      'Preference Study': '/extensions?pref-exp',
    },
  };

  /**
   * Given an object of title:url's, recursively builds a tree navigation UI.
   * Steps through each nested menu and creates `SubMenu`s if needed, otherwise
   * creates an `Item` with a link inside of it.
   *
   * @param  {Object} menu       Menu definition object, can contain nested menus.
   * @param  {String} namespace? Name of the current menu being explored.
   * @return {Node}   Compiled Item or SubMenu node.
   */
  generateMenuContents(menu, namespace = '') {
    return (Object.keys(menu).map(key => {
      let item;

      // A string means it's a URL to the destination page.
      if (typeof menu[key] === 'string') {
        item = (
          <Item key={menu[key]}>
            <Link href={menu[key]}>{key}</Link>
          </Item>
        );
      } else {
      // An object means it's a set of nested menus/items.
        item = (
          <SubMenu title={key} key={key + namespace}>
            { this.generateMenuContents(menu[key], key) }
          </SubMenu>
        );
      }

      return item;
    }));
  }

  render() {
    const { pathname, search } = this.props.router;

    return (
      <Menu
        defaultOpenKeys={['Recipes', 'Extensions']}
        selectedKeys={[pathname + search]}
        mode="inline"
      >
        { this.generateMenuContents(NavigationMenu.menuList) }
      </Menu>
    );
  }
}


export default connect(
  state => ({
    router: state.router,
  }),
)(NavigationMenu);
