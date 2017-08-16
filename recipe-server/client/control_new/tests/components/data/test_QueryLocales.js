import { List } from 'immutable';
import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryLocales';

const { WrappedComponent: QueryLocales } = TestComponent;

describe('<QueryLocales>', () => {
  const props = {
    locales: new List(),
    fetchLocales: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryLocales {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchLocales on mount', () => {
    let called = false;
    shallow(<QueryLocales fetchLocales={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchLocales once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryLocales fetchLocales={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryLocales {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
