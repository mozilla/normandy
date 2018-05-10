import React from 'react';
import { shallow } from 'enzyme';

import QueryExtension from 'control/components/data/QueryExtension';
import TestComponent from 'control/components/extensions/EditExtensionPage';

const { WrappedComponent: EditExtensionPage } = TestComponent;

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
