import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/extensions/CreateExtensionPage';

const { WrappedComponent: CreateExtensionPage } = TestComponent;

describe('<CreateExtensionPage>', () => {
  const props = {
    createExtension: () => Promise.resolve(123),
    push: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<CreateExtensionPage {...props} />);

    expect(wrapper).not.toThrow();
  });
});
