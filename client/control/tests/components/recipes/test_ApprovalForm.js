import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/recipes/ApprovalForm';

const { WrappedComponent: ApprovalForm } = TestComponent;

describe('<ApprovalForm>', () => {
  const props = {
    approvalRequest: new Map(),
    closeApprovalRequest: () => {},
    form: {},
    onSubmit: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<ApprovalForm {...props} />);

    expect(wrapper).not.toThrow();
  });
});
