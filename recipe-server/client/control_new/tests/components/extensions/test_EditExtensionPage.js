import React from 'react';
import { shallow, mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import QueryExtension from 'control_new/components/data/QueryExtension';
import TestComponent from 'control_new/components/extensions/EditExtensionPage';

const { WrappedComponent: EditExtensionPage } = TestComponent;


const mockStore = configureMockStore([])({});

describe('<EditExtensionPage>', () => {
  const props = {
    extension: new Map(),
    extensionId: 123,
    updateExtension: () => Promise.resolve(),
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<EditExtensionPage {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should have a QueryExtension component', () => {
    const wrapper = shallow(<EditExtensionPage {...props} />);
    expect(wrapper.find(QueryExtension).length).toBe(1);
  });

  // it('should fire updateExtension when the form is submitted', () => {
  //   let called = false;
  //   const callback = () => new Promise(resolve => { called = true; resolve(); });
  //   const wrapper = mount(
  //     <Provider store={mockStore}>
  //       <EditExtensionPage {...props} updateExtension={callback} />
  //     </Provider>,
  //   );

  //   wrapper.find('[type="submit"]').get(0).click();

  //   setTimeout(() => { expect(called).toBe(true); }, 1);
  // });
});
