import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import controlStore from '../../static/control/js/stores/ControlStore.js';

import ActionForm from '../../static/control/js/components/ActionForm.js';

describe('<ActionForm>', () => {
  let store;

  beforeAll(() => {
    store = controlStore();
  });

  it('should work', () => {
    mount(<Provider store={store}><ActionForm name="console-log" /></Provider>);
  });

  it('raises an exception with unknown action names', () => {
    expect(() => {
      mount(<Provider store={store}><ActionForm name="does-not-exist" /></Provider>);
    })
    .toThrow(new Error('Unexpected action name: "does-not-exist"'));
  });

  it('should show the right action form', () => {
    const wrapper = mount(<Provider store={store}><ActionForm name="console-log" /></Provider>);
    expect(wrapper.contains('ConsoleLogForm'));
  });
});
