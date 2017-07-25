import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control_new/components/extensions/CreateExtensionPage';

const { WrappedComponent: CreateExtensionPage } = TestComponent;

describe('<CreateExtensionPage>', () => {
  const props = {
    createExtension: () => Promise.resolve(123),
    push: () => {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<CreateExtensionPage {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should fire createExtension when the form is submitted', (done) => {
    let called = false;
    const callback = () => {
      called = true;
      return Promise.resolve();
    };
    const wrapper = mount(<CreateExtensionPage {...props} createExtension={callback} />);

    wrapper.find('[type="submit"]').get(0).click();

    setTimeout(() => {
      expect(called).toBe(true);
      done();
    }, 25);
  });

  it('should `push` to the new URL after successful creation', (done) => {
    let pushedUrl;
    const wrapper = mount(
      <CreateExtensionPage
        {...props}
        push={url => {
          pushedUrl = url;
        }}
      />,
    );

    // Both fail:
    // wrapper.find('[type="submit"]').get(0).click();
    wrapper.find('form').simulate('submit');

    setTimeout(() => {
      expect(pushedUrl).toBe('/extension/123');
      done();
    }, 25);
  });

  it('should NOT `push` if creation failed', (done) => {
    let pushed = false;
    const testProps = {
      createExtension: () => Promise.reject(),
      push: () => { pushed = true; },
    };

    const wrapper = mount(<CreateExtensionPage {...testProps} />);

    wrapper.find('[type="submit"]').get(0).click();

    setTimeout(() => {
      expect(pushed).toBe(false)
      done();
    }, 1);
  });
});
