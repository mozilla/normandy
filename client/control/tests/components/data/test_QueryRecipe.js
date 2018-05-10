import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/data/QueryRecipe';

const { WrappedComponent: QueryRecipe } = TestComponent;

describe('<QueryRecipe>', () => {
  const props = {
    fetchRecipe: () => {},
    pk: 1,
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryRecipe {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchRecipe on mount', () => {
    let called = false;
    mount(<QueryRecipe {...props} fetchRecipe={() => { called = true; }} />);

    expect(called).toBe(true);
  });

  it('should call fetchRecipe if the `pk` changes', () => {
    let callCount = 0;
    const wrapper = shallow(<QueryRecipe {...props} fetchRecipe={() => { callCount += 1; }} />);
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

  it('should call fetchRecipe once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryRecipe {...props} fetchRecipe={() => { callCount += 1; }} />
      </div>,
    );
    expect(callCount).toBe(1);

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryRecipe {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
