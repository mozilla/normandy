import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/RevisionApprovalTag';

const { WrappedComponent: RevisionApprovalTag } = TestComponent;

describe('<RevisionApprovalTag>', () => {
  const props = {
    revision: new Map(),
    status: null,
  };

  it('should work', () => {
    const wrapper = () => shallow(<RevisionApprovalTag {...props} />);

    expect(wrapper).not.toThrow();
  });
});
