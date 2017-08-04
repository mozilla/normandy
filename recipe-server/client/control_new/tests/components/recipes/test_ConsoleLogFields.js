import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import ConsoleLogFields from 'control_new/components/recipes/ConsoleLogFields';

describe('<ConsoleLogFields>', () => {
  const props = {
    disabled: false,
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<ConsoleLogFields {...props} />);

    expect(wrapper).not.toThrow();
  });
});
