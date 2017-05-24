import React from 'react';
import { shallow, mount } from 'enzyme';
import { Field } from 'redux-form';

import { ControlField, buildControlField } from 'control/components/Fields.js';

describe('<ControlField>', () => {
  it('should pass the component prop as InputComponent and pass through all others', () => {
    const wrapper = shallow(<ControlField component="input" type="text" name="test" />);
    const field = wrapper.find(Field);
    expect(field.prop('InputComponent')).toBe('input');
    expect(field.prop('type')).toBe('text');
    expect(field.prop('name')).toBe('test');
  });

  // Test buildControlField separately to avoid having to create a full
  // redux-form to properly render <Field>s using mount().
  describe('buildControlField', () => {
    function propFixture(props) {
      return {
        input: {},
        meta: {},
        InputComponent: 'input',
        type: 'text',
        name: 'test',
        label: 'Test',
        ...props,
      };
    }

    it('should render the input component within a label tag', () => {
      const component = buildControlField(propFixture());
      const wrapper = mount(component);
      expect(wrapper.is('label')).toBe(true);
      expect(wrapper.find('input[type="text"]').isEmpty()).toBe(false);
      expect(wrapper.find('.error').isEmpty()).toBe(true);
    });

    it('should apply the className prop to the label className', () => {
      const component = buildControlField(propFixture({
        className: 'test-class',
      }));
      const wrapper = mount(component);
      expect(wrapper.hasClass('test-class')).toBe(true);
    });

    it('should display an error if one exists in the meta prop', () => {
      const component = buildControlField(propFixture({
        meta: { error: 'error message' },
      }));
      const wrapper = mount(component);
      expect(wrapper.find('.error').text()).toBe('error message');
    });
  });
});
