import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/ApprovalHistoryPage';

const { WrappedComponent: ApprovalHistoryPage } = TestComponent;

describe('<ApprovalHistoryPage>', () => {
  const props = {
    history: new List(),
    recipeId: 123,
  };

  it('should work', () => {
    const wrapper = () => shallow(<ApprovalHistoryPage {...props} />);

    expect(wrapper).not.toThrow();
  });
});
