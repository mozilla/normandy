import React from 'react';
// import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
// import configureMockStore from 'redux-mock-store';
// import thunk from 'redux-thunk';

import HeartbeatForm from '../../../static/control/js/components/action_forms/HeartbeatForm.js';

// const mockStore = configureMockStore([thunk]);

describe('<HeartbeatForm>', () => {
  it('should work', () => {
    const fields = {
      surveys: {},
    };
    shallow(<HeartbeatForm fields={fields} />);
  });
});
