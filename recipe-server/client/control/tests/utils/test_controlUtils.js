import absolutePath from 'client/utils/absolute-path';
import closest from 'client/utils/closest';

describe('controlApp Utils', () => {
  describe('utils/absolute-path', () => {
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

  describe('utils/closest', () => {
    it('should attempt to find a parent element based on selector', () => {
      const testContainer = document.createElement('div');
      testContainer.innerHTML = [
        '<span class="test">',
        '<div class="nest">',
        '<button class="target" />',
        '</div>',
        '</span>',
      ].join('');

      const target = testContainer.querySelector('button');
      expect(closest(target, '.nest') instanceof Element).toBe(true);
      expect(closest(target, '.test') instanceof Element).toBe(true);
      expect(closest(target, '#nonexistant')).toBe(null);
    });
  });
});
