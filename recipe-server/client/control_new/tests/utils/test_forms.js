import React from 'react';
import { mount } from 'enzyme';

import { createForm, connectFormProps } from 'control_new/utils/forms';

class FakeComponent extends React.Component { render() { return null; } }

describe('Forms utils', () => {
  describe('createForm', () => {
    it('should exist', () => {
      expect(!!createForm).toBe(true);
    });

    it('should return the nested React element', () => {
      const FakeForm = createForm({})(FakeComponent);
      const form = mount(<FakeForm />);
      expect(form.find(FakeComponent).length).toBe(1);
    });
  });

  describe('connectFormProps', () => {
    it('should exist', () => {
      expect(!!connectFormProps).toBe(true);
    });

    it('should return the nested React component', () => {
      const ConnectedComponent = connectFormProps(FakeComponent);
      const comp = mount(<ConnectedComponent />);
      expect(comp.find(FakeComponent).length).toBe(1);
    });

    it('should add `form` and `formErrors` props to the nested component', () => {
      const ConnectedComponent = connectFormProps(FakeComponent);
      const comp = mount(<ConnectedComponent />);
      const props = Object.keys(comp.find(FakeComponent).props());
      expect(props).toEqual(['form', 'formErrors']);
    });
  });
});
