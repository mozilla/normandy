import { List, Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/DetailPage';

const { WrappedComponent: DetailPage } = TestComponent;

describe('<DetailPage>', () => {
  const props = {
    history: new List(),
    recipeId: 123,
    revision: new Map(),
    revisionId: 'abc',
  };

  it('should work', () => {
    const wrapper = () => shallow(<DetailPage {...props} />);

    expect(wrapper).not.toThrow();
  });
});
