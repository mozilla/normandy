import { List, Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import OptOutStudyFields from 'control_new/components/recipes/OptOutStudyFields';

describe('<OptOutStudyFields>', () => {
  const props = {
    disabled: false,
    extensions: new List(),
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<OptOutStudyFields {...props} />);

    expect(wrapper).not.toThrow();
  });
});
