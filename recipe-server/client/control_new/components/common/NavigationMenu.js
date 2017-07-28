import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Menu } from 'antd';
import { Link } from 'redux-little-router';

const { SubMenu, Item } = Menu;

@connect(
  state => ({
    router: state.router,
  }),
)
export default class NavigationMenu extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };

  render() {
    const { router } = this.props;
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
        </SubMenu>

        <SubMenu title="Extensions" key="Extensions">
          <Item key="/extension">
            <Link href="/extension">View All</Link>
          </Item>
        </SubMenu>
      </Menu>
    );
  }
}
