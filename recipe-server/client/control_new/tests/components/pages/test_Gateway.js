import React from 'react';
import { shallow } from 'enzyme';

import Gateway from 'control_new/components/pages/Gateway';

describe('<Gateway>', () => {
  it('should work', () => {
    const wrapper = () =>
      shallow(<Gateway />);

    expect(wrapper).not.toThrow();
  });

  it('should have a link to the recipe listing', () => {
    const wrapper = shallow(<Gateway />);
    expect(wrapper.find('[href="/recipe"]').length).toBe(1);
  });

  it('should have a link to the extension listing', () => {
    const wrapper = shallow(<Gateway />);
    expect(wrapper.find('[href="/extension"]').length).toBe(1);
  });
});
