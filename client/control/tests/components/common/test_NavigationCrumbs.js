import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/common/NavigationCrumbs';

const { WrappedComponent: NavigationCrumbs } = TestComponent;

describe('<NavigationCrumbs>', () => {
  const props = {
    breadcrumbs: [],
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<NavigationCrumbs {...props} />);

    expect(wrapper).not.toThrow();
  });
});
