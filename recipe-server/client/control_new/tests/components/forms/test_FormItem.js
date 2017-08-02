import React from 'react';
import { shallow } from 'enzyme';

import FormItem from 'control_new/components/forms/FormItem';

describe('<FormItem>', () => {
  const props = {
    children: <input type="text" />,
    config: {},
    connectToForm: true,
    form: {},
    formErrors: {},
    initialValue: null,
    name: null,
    rules: null,
  };

  it('should work', () => {
    const wrapper = () => shallow(<FormItem {...props} />);

    expect(wrapper).not.toThrow();
  });
});
