import { Menu } from 'antd';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import QuerySessionInfo from 'control/components/data/QuerySessionInfo';
import { getSessionHistory } from 'control/state/app/session/selectors';
import ShieldIdenticon from 'control/components/common/ShieldIdenticon';
import { isExperimenterConfigured } from 'control/state/app/serviceInfo/selectors';

const { Divider, Item, SubMenu } = Menu;

@connect(
  state => ({
    experimenterConfigured: isExperimenterConfigured(state),
    extensionSessionHistory: getSessionHistory(state, 'extension'),
    recipeSessionHistory: getSessionHistory(state, 'recipe'),
    router: state.router,
  }),
)
export default class NavigationMenu extends React.PureComponent {
  static propTypes = {
    experimenterConfigured: PropTypes.bool.isRequired,
    extensionSessionHistory: PropTypes.instanceOf(List).isRequired,
    recipeSessionHistory: PropTypes.instanceOf(List).isRequired,
    router: PropTypes.object.isRequired,
  };

  render() {
    const {
      experimenterConfigured,
      extensionSessionHistory,
      recipeSessionHistory,
      router,
    } = this.props;
    const { pathname, search } = router;

    let importExperiments;
    if (experimenterConfigured) {
      importExperiments = (
        <Item key="/recipe/import/">
          <Link href="/recipe/import/">Import Experiments</Link>
        </Item>
      );
    }

    return (
      <div className="nav-menu">
        <QuerySessionInfo />
        <Menu
          defaultOpenKeys={['Recipes', 'Extensions']}
          selectedKeys={[pathname + search]}
          mode="inline"
        >
          <Item key="/"><Link href="/">Home</Link></Item>

          <SubMenu title="Recipes" key="Recipes">
            <Item key="/recipe/">
              <Link href="/recipe/">View All</Link>
            </Item>

            {recipeSessionHistory.size > 0 && <Divider />}

            {
              recipeSessionHistory.map(item =>
                (<Item key={item.get('url')}>
                  <Link href={item.get('url')}>
                    <ShieldIdenticon seed={item.get('identicon')} size={20} />
                    { item.get('caption') }
                  </Link>
                </Item>),
              )
            }

            {importExperiments}
          </SubMenu>

          <SubMenu title="Extensions" key="Extensions">
            <Item key="/extension/">
              <Link href="/extension/">View All</Link>
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
