import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/DetailsActionBar';

const { WrappedComponent: DetailsActionBar } = TestComponent;

describe('<DetailsActionBar>', () => {
  const props = {
    disableRecipe: () => {},
    enableRecipe: () => {},
    isApprovable: false,
    isLatest: false,
    isLatestApproved: false,
    isPendingApproval: false,
    recipe: new Map(),
    recipeId: 123,
    requestRevisionApproval: () => {},
    revisionId: 'abc',
    routerPath: '/path/to/page',
  };

  it('should work', () => {
    const wrapper = () => shallow(<DetailsActionBar {...props} />);

    expect(wrapper).not.toThrow();
  });
});
