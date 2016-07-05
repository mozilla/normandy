import { push } from 'react-router-redux';

import TestUtils from 'react/lib/ReactTestUtils';

import { createApp } from '../static/control/js/app.js';
import NoMatch from '../static/control/js/components/NoMatch.jsx';

describe('Control routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('renders the NoMatch component for unmatched routes', () => {
    let element = TestUtils.renderIntoDocument(app.rootComponent);
    app.store.dispatch(push('/control/does/not/exist'));

    let noMatch = TestUtils.findRenderedComponentWithType(element, NoMatch);
    expect(noMatch).toBeTruthy();
  });
});
