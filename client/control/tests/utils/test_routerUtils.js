import { searchRouteTree, replaceUrlVariables } from 'control/routerUtils';

describe('Router utils', () => {
  describe('searchRouteTree', () => {
    const routes = {
      '/': {
        slug: 'home',
        '/test': {
          slug: 'test',
        },
        '/test2': {
          slug: 'other-test',
          '/nested': {
            '/even': {
              '/further': {
                slug: 'nested',
              },
            },
          },
        },
      },
    };

    it('should find shallow routes', () => {
      expect(searchRouteTree(routes, 'home')).toBe('/');
      expect(searchRouteTree(routes, 'test')).toBe('/test');
    });

    it('should find deeply nested routes', () => {
      expect(searchRouteTree(routes, 'nested')).toBe('/test2/nested/even/further');
    });

    it('should return `null` when a route is not found', () => {
      expect(searchRouteTree(routes, 'not present')).toBe(null);
      expect(searchRouteTree(routes, 'testtt')).toBe(null);
      expect(searchRouteTree(routes, 'test ')).toBe(null);

      expect(searchRouteTree({}, 'not present again')).toBe(null);
    });
  });

  describe('replaceUrlVariables', () => {
    it('should handle strings without variables', () => {
      // No trailing slash
      let url = replaceUrlVariables('/hey/ron', {});
      expect(url).toBe('/hey/ron');

      // Trailing slash
      url = replaceUrlVariables('/hey/ron/', {});
      expect(url).toBe('/hey/ron/');
    });

    it('should replace variables in strings', () => {
      // No trailing slash
      let url = replaceUrlVariables('/hey/:name', { name: 'billy' });
      expect(url).toBe('/hey/billy');

      // Trailing slash
      url = replaceUrlVariables('/hey/:name/', { name: 'billy' });
      expect(url).toBe('/hey/billy/');
    });

    it('should replace multiple variables', () => {
      // No trailing slash
      let url = replaceUrlVariables('/:one/:two', {
        one: 'that',
        two: 'hurt',
      });
      expect(url).toBe('/that/hurt');

      // Trailing slash
      url = replaceUrlVariables('/:one/:two/', {
        one: 'that',
        two: 'hurt',
      });
      expect(url).toBe('/that/hurt/');
    });
  });
});

