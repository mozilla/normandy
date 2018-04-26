import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/extensions/ExtensionListing';

const { WrappedComponent: ExtensionListing } = TestComponent;

describe('<ExtensionListing>', () => {
  const props = {
    columns: new List(),
    count: 10,
    extensions: new List(),
    getCurrentURL: () => {},
    ordering: null,
    pageNumber: 1,
    push: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<ExtensionListing {...props} />);

    expect(wrapper).not.toThrow();
  });
});
