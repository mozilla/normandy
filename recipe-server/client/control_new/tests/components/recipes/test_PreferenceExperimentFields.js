import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import PreferenceExperimentFields, { StringPreferenceField } from 'control_new/components/recipes/PreferenceExperimentFields';

function createFakeEvent(string) {
  return { target: { value: string } };
}

describe('<PreferenceExperimentFields>', () => {
  const props = {
    disabled: false,
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<PreferenceExperimentFields {...props} />);

    expect(wrapper).not.toThrow();
  });

  describe('<StringPreferenceField>', () => {
    it('should correctly trim whitespace', () => {
      const trimmedValues = [];
      const stringPrefFieldInstance = new StringPreferenceField({
        onChange: value => { trimmedValues.push(value); },
      });

      const whitespaceBefore = createFakeEvent('   foobar');
      const whitespaceAfter = createFakeEvent('foobar   ');
      const noWhitespace = createFakeEvent('foobar');

      // handleChange does not return anything, so I need to use the return value of onChange
      // I store this in trimmedValues
      stringPrefFieldInstance.handleChange(whitespaceBefore);
      stringPrefFieldInstance.handleChange(whitespaceAfter);
      stringPrefFieldInstance.handleChange(noWhitespace);
      expect(trimmedValues.every(value => value === 'foobar')).toBe(true);
    });

    it('should not trim whitespace from the middle of a string', () => {
      let trimmedValue;
      const stringPrefFieldInstance = new StringPreferenceField({
        onChange: value => { trimmedValue = value; },
      });

      const whitespaceMiddleString = 'foo    bar';
      const whiteSpaceMiddleEvent = createFakeEvent(whitespaceMiddleString);

      stringPrefFieldInstance.handleChange(whiteSpaceMiddleEvent);
      expect(trimmedValue).toBe(whitespaceMiddleString);
    });
  });
});
