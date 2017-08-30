import { List } from 'immutable';
import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryCountries';

const { WrappedComponent: QueryCountries } = TestComponent;

describe('<QueryCountries>', () => {
  const props = {
    countries: new List(),
    fetchCountries: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryCountries {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchCountries on mount', () => {
    let called = false;
    shallow(<QueryCountries fetchCountries={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchCountries once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryCountries fetchCountries={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryCountries {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
