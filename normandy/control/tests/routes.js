import { push } from 'react-router-redux';
import { shallow } from 'enzyme';

import { createApp } from '../static/control/js/app.js';
import NoMatch from '../static/control/js/components/NoMatch.jsx';

describe('Control routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('renders the NoMatch component for unmatched routes', () => {
    const element = shallow(app.rootComponent);
    app.store.dispatch(push('/control/does/not/exist'));
    expect(element.find(NoMatch)).toBeTruthy();
  });
});
