import { replace } from 'react-router-redux';
import { shallow } from 'enzyme';

import { createApp } from 'control/app';
import NoMatch from 'control/components/NoMatch.js';

describe('Control routes', () => {
  let app;
  let originalUrl;

  beforeEach(() => {
    app = createApp();
    originalUrl = window.location.toString();
  });

  afterEach(() => {
    app.store.dispatch(replace(originalUrl));
  });

  it('renders the NoMatch component for unmatched routes', () => {
    const element = shallow(app.rootComponent);
    app.store.dispatch(replace('/control/does/not/exist'));
    expect(element.find(NoMatch)).toBeTruthy();
  });
});
