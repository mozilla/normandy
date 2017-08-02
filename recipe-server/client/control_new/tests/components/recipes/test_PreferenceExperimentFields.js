import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import PreferenceExperimentFields from 'control_new/components/recipes/PreferenceExperimentFields';

describe('<PreferenceExperimentFields>', () => {
  const props = {
    disabled: false,
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<PreferenceExperimentFields {...props} />);

    expect(wrapper).not.toThrow();
  });
});
