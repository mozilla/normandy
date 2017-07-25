import { Map } from 'immutable';
import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/data/QueryRecipes';
const { WrappedComponent: QueryRecipes } = TestComponent;

describe('<QueryRecipes>', () => {
  const props = {
    fetchFilteredRecipesPage: ()=>{},
    filters: new Map(),
    pageNumber: 1,
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<QueryRecipes {...props}  />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchFilteredRecipesPage on mount', () => {
    let called = false;
    const wrapper = mount(<QueryRecipes {...props} fetchFilteredRecipesPage={()=>{called = true;}} />);

    expect(called).toBe(true);
  });

  it('should call fetchFilteredRecipesPage if the `pageNumber` changes', () => {
    let callCount = 0;
    const wrapper = shallow(<QueryRecipes {...props} fetchFilteredRecipesPage={()=>{callCount += 1;}} />);
    expect(callCount).toBe(1);

    wrapper.setProps({ pageNumber: 2 });
    expect(callCount).toBe(2);

    wrapper.setProps({ irrelevant: true });
    expect(callCount).toBe(2);

    wrapper.setProps({ pageNumber: 2 });
    expect(callCount).toBe(2);

    wrapper.setProps({ pageNumber: 3 });
    expect(callCount).toBe(3);
  });

  it('should call fetchFilteredRecipesPage if the `filters` change', () => {
    let callCount = 0;
    const wrapper = shallow(<QueryRecipes {...props} fetchFilteredRecipesPage={()=>{callCount += 1;}} />);
    expect(callCount).toBe(1);

    wrapper.setProps({ filters: new Map() });
    expect(callCount).toBe(2);

    wrapper.setProps({ irrelevant: true });
    expect(callCount).toBe(2);

    wrapper.setProps({ filters: new Map() });
    expect(callCount).toBe(3);
  });

  it('should call fetchFilteredRecipesPage once if container props change', () => {
    let callCount = 0;
    const wrapper = mount(
      <div fakeProp={1}>
        <QueryRecipes  {...props} fetchFilteredRecipesPage={()=>{callCount += 1;}} />
      </div>
    );
    expect(callCount).toBe(1);

    wrapper.setProps({ fakeProp: 2 });
    wrapper.setProps({ fakeProp: 3 });
    wrapper.setProps({ fakeProp: 4 });

    expect(callCount).toBe(1);
  });

  it('should not render anything', ()=>{
    const wrapper = shallow(<QueryRecipes {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
