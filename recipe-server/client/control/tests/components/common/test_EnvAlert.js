import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/common/EnvAlert';

const { WrappedComponent: EnvAlert } = TestComponent;

describe('<EnvAlert>', () => {
  const props = {
    currentUrl: 'http://localhost:8000/',
  };

  it('should work', () => {
    const wrapper = () => shallow(<EnvAlert {...props} />);

    expect(wrapper).not.toThrow();
  });

  describe('findFragmentsInURL', () => {
    const testStrings = ['normandy-admin', 'stage', '/control/'];

    it('should find a piece of a string amongst an array of strings', () => {
      let result = EnvAlert.findFragmentsInURL('https://www.normandy-admin.stage.com/control/',
        testStrings);
      expect(result).toBe(true);

      result = EnvAlert.findFragmentsInURL('http://firefox.com/normandy-admin/', testStrings);
      expect(result).toBe(true);

      result = EnvAlert.findFragmentsInURL('http://mozilla.org/control', testStrings);
      expect(result).toBe(false);
    });
  });


  describe('production env', () => {
    const url = 'https://www.normandy-admin.prod.com/control/';

    it('should not render on production', () => {
      const wrapper = mount(<EnvAlert currentUrl={url} />);
      expect(wrapper.children().length).toBe(0);
    });
  });

  describe('staging env', () => {
    const url = 'https://www.normandy-admin.stage.com/control/';

    it('should render on staging', () => {
      const wrapper = mount(<EnvAlert currentUrl={url} />);
      expect(wrapper.children().length).not.toBe(0);
    });

    it('should say it is a staging environment', () => {
      const wrapper = mount(<EnvAlert currentUrl={url} />);
      expect(wrapper.text()).toContain('staging environment');
    });
  });

  describe('dev env', () => {
    const url = 'http://localhost:8000/control/';

    it('should render on dev', () => {
      const wrapper = mount(<EnvAlert currentUrl={url} />);
      expect(wrapper.children().length).not.toBe(0);
    });

    it('should say it is a dev environment', () => {
      const wrapper = mount(<EnvAlert currentUrl={url} />);
      expect(wrapper.text()).toContain('development environment');
    });
  });
});
