import React from 'react';
import { shallow } from 'enzyme';

import EnvAlert from 'control_new/components/common/EnvAlert';

describe('<EnvAlert>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<EnvAlert />);

    expect(wrapper).not.toThrow();
  });

  describe('findPartialString', () => {
    const testStrings = ['abc', 'def'];

    it('should find a piece of a string amongst an array of strings', () => {
      // abc is present in 'abc'
      let result = EnvAlert.findPartialString('abc', testStrings);
      expect(result).toBe(true);

      // ef is present in 'def'
      result = EnvAlert.findPartialString('ef', testStrings);
      expect(result).toBe(true);

      // xyz is not present
      result = EnvAlert.findPartialString('xyz', testStrings);
      expect(result).toBe(false);

      // abcdef is not present
      result = EnvAlert.findPartialString('abcdef', testStrings);
      expect(result).toBe(false);
    });
  });

  it('should have accurate production URLs', () => {
    expect(EnvAlert.productionUrls).toEqual(['normandy-admin.prod.']);
  });

  it('should have accurate staging URLs', () => {
    expect(EnvAlert.stageUrls).toEqual(['normandy-admin.stage.']);
  });
});
