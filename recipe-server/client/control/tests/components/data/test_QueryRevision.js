import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/data/QueryRevision';

const { WrappedComponent: QueryRevision } = TestComponent;

describe('<QueryRevision>', () => {
  const props = {
    fetchRevision: () => {},
    pk: 1,
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryRevision {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchRevision on mount', () => {
    let called = false;
    mount(<QueryRevision {...props} fetchRevision={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchRevision if the `pk` changes', () => {
    let callCount = 0;
    const wrapper = shallow(<QueryRevision {...props} fetchRevision={() => { callCount += 1; }} />);
    expect(callCount).toBe(1);

    wrapper.setProps({ pk: 2 });
    expect(callCount).toBe(2);

    wrapper.setProps({ irrelevant: true });
    expect(callCount).toBe(2);

    wrapper.setProps({ pk: 2 });
    expect(callCount).toBe(2);

    wrapper.setProps({ pk: 3 });
    expect(callCount).toBe(3);
  });

  it('should call fetchRevision once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryRevision {...props} fetchRevision={() => { callCount += 1; }} />
      </div>,
    );
    expect(callCount).toBe(1);

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryRevision {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
