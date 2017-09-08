import { Menu } from 'antd';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import QuerySessionInfo from 'control_new/components/data/QuerySessionInfo';
import { getSessionHistory } from 'control_new/state/app/session/selectors';

const { Divider, Item, SubMenu } = Menu;

@connect(
  state => ({
    recipeSessionHistory: getSessionHistory(state, 'recipe'),
    extensionSessionHistory: getSessionHistory(state, 'extension'),
    router: state.router,
  }),
)
export default class NavigationMenu extends React.PureComponent {
  static propTypes = {
    recipeSessionHistory: PropTypes.instanceOf(List).isRequired,
    extensionSessionHistory: PropTypes.instanceOf(List).isRequired,
    router: PropTypes.object.isRequired,
  };

  render() {
    const { router, recipeSessionHistory, extensionSessionHistory } = this.props;
    const { pathname, search } = router;

    return (
      <div>
        <QuerySessionInfo />
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

            {recipeSessionHistory.size > 0 && <Divider />}

            {
              recipeSessionHistory.map(item =>
                (<Item key={item.get('url')}>
                  <Link href={item.get('url')}>{ item.get('caption') }</Link>
                </Item>),
              )
            }
          </SubMenu>

          <SubMenu title="Extensions" key="Extensions">
            <Item key="/extension">
              <Link href="/extension">View All</Link>
            </Item>

            {extensionSessionHistory.size > 0 && <Divider />}

            {
              extensionSessionHistory.map(item =>
                (<Item key={item.get('url')}>
                  <Link href={item.get('url')}>{ item.get('caption') }</Link>
                </Item>),
              )
            }
          </SubMenu>
        </Menu>
      </div>
    );
  }
}
