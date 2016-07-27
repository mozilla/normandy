import React from 'react';
import { shallow } from 'enzyme';

import HeartbeatForm from '../../../static/control/js/components/action_forms/HeartbeatForm.js';


describe('<HeartbeatForm>', () => {
  it('should work', () => {
    const fields = {
      surveys: {},
    };
    shallow(<HeartbeatForm fields={fields} />);
  });
});
