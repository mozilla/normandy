import React from 'react';
import { shallow } from 'enzyme';

import EnvAlert from 'control_new/components/common/EnvAlert';

describe('<EnvAlert>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<EnvAlert />);

    expect(wrapper).not.toThrow();
  });

  describe('findFragmentsInURL', () => {
    const testStrings = ['normandy-admin', 'fake-url.com', '/control/'];

    it('should find a piece of a string amongst an array of strings', () => {
      let result = EnvAlert.findFragmentsInURL('https://www.normandy-admin.stage.com/control/',
        testStrings);
      expect(result).toBe(true);

      result = EnvAlert.findFragmentsInURL('https://www.fake-url.com/', testStrings);
      expect(result).toBe(true);

      result = EnvAlert.findFragmentsInURL('http://mozilla.org/', testStrings);
      expect(result).toBe(false);

      result = EnvAlert.findFragmentsInURL('https://youtu.be/dQw4w9WgXcQ', testStrings);
      expect(result).toBe(false);

      result = EnvAlert.findFragmentsInURL('http://firefox.com/normandy-admin/', testStrings);
      expect(result).toBe(true);
    });
  });
});
