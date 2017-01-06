import absolutePath from '../../../utils/absolute-path';

describe('controlApp Utils', () => {
  describe('absolute-path', () => {
    it('creates an absolute path from a relative', () => {
      let path = absolutePath('http://mozilla.com/a/b/c/', '../');
      expect(path).toBe('http://mozilla.com/a/b/');

      path = absolutePath('http://mozilla.com/a/b/c/', './');
      expect(path).toBe('http://mozilla.com/a/b/c/');

      path = absolutePath('http://mozilla.com/a/b/c/', '../../');
      expect(path).toBe('http://mozilla.com/a/');

      path = absolutePath('http://mozilla.com/a/b/c/', '../../../');
      expect(path).toBe('http://mozilla.com/');
    });
  });
});
