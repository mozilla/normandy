import absolutePath from 'client/utils/absolute-path';
import cloneArrayValues, { cloneArrayRefs } from 'client/utils/clone-array';
import deepCompare from 'client/utils/deep-compare';
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


  describe('utils/clone-array', () => {
    describe('cloneArrayValues', () => {
      it('should throw an error if not given an array', () => {
        expect(() => {
          cloneArrayValues({});
        }).toThrow();
      });

      it('should return a new array of new values', () => {
        const testArray = [{ hi: 'there' }];
        const clone = cloneArrayValues(testArray);

        // shouldn't equate since it should be a new object
        expect(clone[0] === testArray[0]).toBe(false);

        // confirm our output is the same as the input
        expect(clone[0]).toEqual({ hi: 'there' });
      });

      it('should return an empty array if not given any params', () => {
        const returned = cloneArrayValues();

        expect(returned instanceof Array).toBe(true);
        expect(returned.length).toBe(0);
      });
    });

    describe('cloneArrayRefs', () => {
      it('should throw an error if not given an array', () => {
        expect(() => {
          cloneArrayRefs({});
        }).toThrow();
      });

      it('should return a new array of existing objects', () => {
        const testArray = [{ hi: 'there' }];
        const clone = cloneArrayRefs(testArray);

        // should equate since it is the same object,
        // just in a new array
        expect(clone[0] === testArray[0]).toBe(true);

        // confirm our output is the same as the input
        expect(clone[0]).toEqual({ hi: 'there' });
      });

      it('should return an empty array if not given any params', () => {
        const returned = cloneArrayRefs();

        expect(returned instanceof Array).toBe(true);
        expect(returned.length).toBe(0);
      });
    });

    describe('utils/deep-compare', () => {
      it('should compare two objects appropriately', () => {
        // test objects
        const objA = {
          hi: 'there',
        };
        const objB = {
          hey: 'there',
        };
        const objC = {
          hello: 'there',
          nested: {
            property: 'to test',
          },
        };

        // compare two different objects
        expect(deepCompare(objA, objB)).toBe(false);

        // compare matching objects
        expect(deepCompare(objA, { ...objA })).toBe(true);

        // compare deep properties
        expect(deepCompare(objC, { ...objC })).toBe(true);
        expect(deepCompare(objC, { ...objC, nested: false })).toBe(false);
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
});
