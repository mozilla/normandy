import { replace } from 'react-router-redux';
import { shallow } from 'enzyme';

import { createApp } from 'control_old/app';
import NoMatch from 'control_old/components/NoMatch';

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
    app.store.dispatch(replace('/control_old/does/not/exist'));
    expect(element.find(NoMatch)).toBeTruthy();
  });
});
