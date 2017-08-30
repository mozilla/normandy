import React from 'react';
import { shallow } from 'enzyme';

import WrappedFormItem from 'control_new/components/forms/FormItem';

const FormItem = WrappedFormItem.wrappedComponent;

function createFakeEvent(string) {
  return { target: { value: string } };
}

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
    const wrapper = () => shallow(<WrappedFormItem {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should correctly trim whitespace', () => {
    const formItemInstance = new FormItem();

    const whitespaceBefore = createFakeEvent('   foobar');
    const whitespaceAfter = createFakeEvent('foobar   ');
    const noWhitespace = createFakeEvent('foobar');

    const expectedValue = 'foobar';
    expect(formItemInstance.trimValue(whitespaceBefore)).toBe(expectedValue);
    expect(formItemInstance.trimValue(whitespaceAfter)).toBe(expectedValue);
    expect(formItemInstance.trimValue(noWhitespace)).toBe(expectedValue);
  });
});
