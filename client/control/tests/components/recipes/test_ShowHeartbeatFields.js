import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import ShowHeartbeatFields from 'control/components/recipes/ShowHeartbeatFields';

describe('<ShowHeartbeatFields>', () => {
  const props = {
    disabled: false,
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<ShowHeartbeatFields {...props} />);

    expect(wrapper).not.toThrow();
  });
});
