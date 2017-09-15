import { mount } from 'enzyme';
import { Map, fromJS } from 'immutable';
import React from 'react';

import { ActionSelect as TestComponent } from 'control_new/components/recipes/RecipeForm';

const { WrappedComponent: ActionSelect } = TestComponent;

describe('<ActionSelect>', () => {
  const props = {
    actions: new Map(),
    value: '',
  };

  it('should work', () => {
    const wrapper = () => mount(<ActionSelect {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should handle actions with or without IDs', () => {
    const actions = fromJS({
      action1: { id: undefined, name: 'One' },
      action2: { id: null, name: 'Two' },
      action3: { name: 'Three' },
      action4: { id: 123, name: 'Four' },
    });

    const wrapper = () => mount(<ActionSelect actions={actions} />);
    expect(wrapper).not.toThrow();
  });
});
