import { Switch } from 'antd';
import autobind from 'autobind-decorator';
import React from 'react';
import { mount } from 'enzyme';

import LabeledInput from 'control/components/forms/LabeledInput';

@autobind
class TestInput extends LabeledInput {
  getElement() { return Switch; }
  getElementProps() { return { checked: this.props.value, testProp: 123 }; }
  handleLabelClick() { this.props.onChange(); }
}

describe('<LabeledInput>', () => {
  const props = {
    children: null,
    onChange: () => {},
    value: null,
  };

  const factory = (customProps = {}) => mount(<TestInput {...props} {...customProps} />);

  it('should work', () => {
    expect(factory).not.toThrow();
  });

  describe('the label', () => {
    it('should not render if there is no label', () => {
      const wrapper = factory();
      expect(wrapper.find('.label').length).toBe(0);
    });

    it('should render the passed in children', () => {
      const label = 'Root beer\'s flavor comes from sassafras and/or sarsaparilla!';
      const wrapper = factory({ children: label });

      // The label should render..
      expect(wrapper.find('.label').length).toBe(1);
      // ..And it should contain the text we passed in.
      expect(wrapper.find('.label').text()).toContain(label);
    });

    it('should trigger an onChange when clicked', () => {
      let called = false;
      const handleChange = () => { called = true; };
      const wrapper = factory({ onChange: handleChange, children: 'Click me!' });

      wrapper.find('.label').simulate('click');
      expect(called).toBe(true);
    });
  });

  describe('getElementProps', () => {
    it('should pass properties into the internal component', () => {
      const wrapper = factory();
      expect(wrapper.find(Switch).length).toBe(1);
      expect(wrapper.find(Switch).props().testProp).toBe(123);
    });

    it('should pass dynamic props (`value` as a `checked` prop)', () => {
      const wrapper = factory({ value: true });
      expect(wrapper.find(Switch).length).toBe(1);
      expect(wrapper.find(Switch).props().checked).toBe(true);

      wrapper.setProps({ value: false });
      expect(wrapper.find(Switch).props().checked).toBe(false);
    });
  });
});
