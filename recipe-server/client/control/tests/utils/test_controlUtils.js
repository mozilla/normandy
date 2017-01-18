import absolutePath from 'client/utils/absolute-path';
import mergeByKey from 'client/utils/merge-arrays';

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

  describe('merge-arrays', () => {
    describe('mergeByKey', () => {
      // testA/B are just "normal" arrays
      const testA = [{ id: 1, a: 1 }, { id: 2, b: 2 }];
      const testB = [{ id: 3, c: 3 }, { id: 4, d: 4 }];
      // testC has a colliding ID with testA
      const testC = [{ id: 2, c: 3 }, { id: 4, d: 4 }];

      it('should return a function', () => {
        const testMerge = mergeByKey('id');

        expect(typeof testMerge).toBe('function');
      });

      it('should combine arrays', () => {
        const testMerge = mergeByKey('id')(testA, testB);

        expect(testMerge).toEqual([
          { id: 1, a: 1 },
          { id: 2, b: 2 },
          { id: 3, c: 3 },
          { id: 4, d: 4 },
        ]);
      });

      it('should de-dupe objects from combined arrays', () => {
        const testMerge = mergeByKey('id')(testA, testC);

        expect(testMerge).toEqual([
          { id: 1, a: 1 },
          { id: 2, c: 3 },
          { id: 4, d: 4 },
        ]);
      });
    });
  });
});
