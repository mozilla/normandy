import React from 'react';
import { shallow } from 'enzyme';

import MissingPage from 'control_new/components/pages/MissingPage';

describe('<MissingPage>', () => {
  it('should work', () => {
    const wrapper = () =>
      shallow(<MissingPage />);

    expect(wrapper).not.toThrow();
  });
});
