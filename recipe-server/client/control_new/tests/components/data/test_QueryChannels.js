import { List } from 'immutable';
import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryChannels';

const { WrappedComponent: QueryChannels } = TestComponent;

describe('<QueryChannels>', () => {
  const props = {
    locales: new List(),
    fetchChannels: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryChannels {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchChannels on mount', () => {
    let called = false;
    shallow(<QueryChannels fetchChannels={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchChannels once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryChannels fetchChannels={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryChannels {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
