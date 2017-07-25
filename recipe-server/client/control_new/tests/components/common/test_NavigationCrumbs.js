import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/common/NavigationCrumbs';

const { WrappedComponent: NavigationCrumbs } = TestComponent;

describe('<NavigationCrumbs>', () => {
  const props = {
    router: {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<NavigationCrumbs {...props} />);

    expect(wrapper).not.toThrow();
  });

  describe('replaceUrlVariables', () => {
    it('should handle strings without variables', () => {
      let url = NavigationCrumbs.replaceUrlVariables('/hey/ron', {});
      expect(url).toBe('/hey/ron');

      // Trailing slash
      url = NavigationCrumbs.replaceUrlVariables('/hey/ron/', {});
      expect(url).toBe('/hey/ron/');
    });

    it('should replace variables in strings', () => {
      let url = NavigationCrumbs.replaceUrlVariables('/hey/:name', { name: 'billy' });
      expect(url).toBe('/hey/billy');

      // Trailing slash
      url = NavigationCrumbs.replaceUrlVariables('/hey/:name/', { name: 'billy' });
      expect(url).toBe('/hey/billy/');
    });

    it('should replace multiple variables', () => {
      let url = NavigationCrumbs.replaceUrlVariables('/:one/:two', {
        one: 'that',
        two: 'hurt',
      });
      expect(url).toBe('/that/hurt');

      // Trailing slash
      url = NavigationCrumbs.replaceUrlVariables('/:one/:two/', {
        one: 'that',
        two: 'hurt',
      });
      expect(url).toBe('/that/hurt/');
    });
  });
});
