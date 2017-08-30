import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/forms/CountriesField';

const { WrappedComponent: CountriesField } = TestComponent;

describe('<CountriesField>', () => {
  const props = {
    countries: new List(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<CountriesField {...props} />);

    expect(wrapper).not.toThrow();
  });
});
