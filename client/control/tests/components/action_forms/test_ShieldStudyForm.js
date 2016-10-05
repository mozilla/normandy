import React from 'react';
import { shallow } from 'enzyme';

import ShieldStudyForm from '../../../components/action_forms/ShieldStudyForm.js';


describe('<ShieldStudyForm>', () => {
  it('should work', () => {
    const fields = {
      studyName: {},
      addonName: {},
      addonUrl: {},
    };
    shallow(<ShieldStudyForm fields={fields} />);
  });
});
