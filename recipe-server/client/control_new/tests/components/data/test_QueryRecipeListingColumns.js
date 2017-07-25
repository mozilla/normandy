import { fromJS } from 'immutable';
import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryRecipeListingColumns';
const { WrappedComponent: QueryRecipeListingColumns } = TestComponent;

describe('<QueryRecipeListingColumns>', () => {
  const props = {
    loadRecipeListingColumns: ()=>{},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryRecipeListingColumns {...props}  />);

    expect(wrapper).not.toThrow();
  });

  it('should call loadRecipeListingColumns on mount', () => {
    let called = false;
    const wrapper = shallow(<QueryRecipeListingColumns loadRecipeListingColumns={()=>{called = true;}} />);

    expect(called).toBe(true);
  });

  it('should call loadRecipeListingColumns once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryRecipeListingColumns loadRecipeListingColumns={()=>{callCount += 1;}} />
      </div>
    );

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', ()=>{
    const wrapper = shallow(<QueryRecipeListingColumns {...props} />);
    expect(wrapper.children().length).toBe(0);
  });

});
