import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryServiceInfo';

const { WrappedComponent: QueryServiceInfo } = TestComponent;

describe('<QueryServiceInfo>', () => {
  const props = {
    fetchServiceInfo: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryServiceInfo {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchServiceInfo on mount', () => {
    let called = false;
    shallow(<QueryServiceInfo fetchServiceInfo={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchServiceInfo once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryServiceInfo fetchServiceInfo={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryServiceInfo {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
