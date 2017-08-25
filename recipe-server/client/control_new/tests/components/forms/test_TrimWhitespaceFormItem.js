import React from 'react';
import { shallow } from 'enzyme';

import TrimWhitespaceFormItem from 'control_new/components/forms/TrimWhitespaceFormItem';

function createFakeEvent(string) {
  return { target: { value: string } };
}

describe('<TrimWhitespaceFormItem>', () => {
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
    const wrapper = () => shallow(<TrimWhitespaceFormItem {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should correctly trim whitespace', () => {
    const trimWhitespaceInstance = new TrimWhitespaceFormItem();

    const whitespaceBefore = createFakeEvent('   foobar');
    const whitespaceAfter = createFakeEvent('foobar   ');
    const noWhitespace = createFakeEvent('foobar');

    const expectedValue = 'foobar';
    expect(trimWhitespaceInstance.trimValue(whitespaceBefore)).toBe(expectedValue);
    expect(trimWhitespaceInstance.trimValue(whitespaceAfter)).toBe(expectedValue);
    expect(trimWhitespaceInstance.trimValue(noWhitespace)).toBe(expectedValue);
  });
});
