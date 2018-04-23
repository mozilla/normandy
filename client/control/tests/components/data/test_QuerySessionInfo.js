import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/data/QuerySessionInfo';

const { WrappedComponent: QuerySessionInfo } = TestComponent;

describe('<QuerySessionInfo>', () => {
  const props = {
    fetchSessionInfo: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QuerySessionInfo {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchSessionInfo on mount', () => {
    let called = false;
    shallow(<QuerySessionInfo fetchSessionInfo={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchSessionInfo once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QuerySessionInfo fetchSessionInfo={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QuerySessionInfo {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
