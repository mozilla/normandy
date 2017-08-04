import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/extensions/ListingActionBar';

const { WrappedComponent: ListingActionBar } = TestComponent;

describe('<ListingActionBar>', () => {
  const props = {
    columns: new List(),
    getCurrentURL: () => {},
    push: () => {},
    saveExtensionListingColumns: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<ListingActionBar {...props} />);

    expect(wrapper).not.toThrow();
  });
});
