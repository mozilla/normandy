import React from 'react';
import ReactDOM from 'react-dom';
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

  describe('getActiveSelectOptions', () => {
    it('should return an empty array if no selections are made', () => {
      const onRender = select =>
        expect(MultiPicker.getActiveSelectOptions(select)).toEqual([]);

      ReactDOM.render(
        <select ref={onRender}>
          <option value="">Select One</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </select>,
        document.createElement('div')
      );
    });

    it('should return an array of selections are made', () => {
      const onRender = select =>
        expect(MultiPicker.getActiveSelectOptions(select)).toEqual(['2']);

      ReactDOM.render(
        <select ref={onRender}>
          <option value="">Select One</option>
          <option value="1">Option 1</option>
          <option value="2" selected>Option 2</option>
          <option value="3">Option 3</option>
        </select>,
        document.createElement('div')
      );
    });

    it('should handle multiple selections', () => {
      const onRender = select =>
        expect(MultiPicker.getActiveSelectOptions(select)).toEqual(['2', '3']);

      ReactDOM.render(
        <select multiple ref={onRender}>
          <option value="">Select One</option>
          <option value="1">Option 1</option>
          <option value="2" selected>Option 2</option>
          <option value="3" selected>Option 3</option>
        </select>,
        document.createElement('div')
      );
    });
  });
});
