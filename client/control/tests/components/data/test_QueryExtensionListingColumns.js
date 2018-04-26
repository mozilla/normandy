import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/data/QueryExtensionListingColumns';

const { WrappedComponent: QueryExtensionListingColumns } = TestComponent;

describe('<QueryExtensionListingColumns>', () => {
  const props = {
    loadExtensionListingColumns: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryExtensionListingColumns {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call loadExtensionListingColumns on mount', () => {
    let called = false;
    shallow(
      <QueryExtensionListingColumns loadExtensionListingColumns={() => { called = true; }} />,
    );

    expect(called).toBe(true);
  });

  it('should call loadExtensionListingColumns once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryExtensionListingColumns loadExtensionListingColumns={() => { callCount += 1; }} />
      </div>,
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryExtensionListingColumns {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
