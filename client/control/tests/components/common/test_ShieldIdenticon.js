import React from 'react';
import { mount } from 'enzyme';

import ShieldIdenticon from 'control/components/common/ShieldIdenticon';

describe('<ShieldIdenticon>', () => {
  const props = {
    seed: 'test',
    size: null,
    className: null,
  };

  it('should work', () => {
    const wrapper = () => mount(<ShieldIdenticon {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should use the v2 api to resolve identicons', () => {
    const wrapper = mount(<ShieldIdenticon {...props} />);

    const nestedImg = wrapper.find('img');
    expect(nestedImg.length).toBe(1);
    expect(nestedImg.props().src).toBe(`/api/v2/identicon/${props.seed}.svg`);
  });
});
