import React from 'react';
import { shallow } from 'enzyme';
import MultiPicker from 'control/components/MultiPicker';

const propFactory = props => ({
  unit: 'Item',
  plural: 'Items',
  options: [],
  // from redux-form
  value: '',
  onChange: () => {},
  ...props,
});

describe('<MultiPicker>', () => {
  it('should render without throwing', () => {
    const wrapper = () => shallow(<MultiPicker {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });
});
