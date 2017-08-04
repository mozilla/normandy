import React from 'react';
import { shallow } from 'enzyme';

import App from 'control_new/components/App';

describe('<App>', () => {
  const props = {
    children: <div>Hello</div>,
  };

  it('should work', () => {
    const wrapper = () => shallow(<App {...props} />);

    expect(wrapper).not.toThrow();
  });
});
