import fetchMock from 'fetch-mock';
import { mockNormandy } from '../../recipes/tests/actions/utils.js';

import { classifyClient, doesRecipeMatch, filterContext } from '../static/js/self_repair_runner.js';


const UUID_ISH_REGEX = /^[a-f0-9-]{36}$/;


describe('Self-Repair Runner', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  describe('classifyClient', () => {
    it('should make a request to the normandy server', async () => {
      const url = '/api/v1/classify/';
      const requestTime = '2016-01-01';
      document.documentElement.dataset.classifyUrl = url;
      fetchMock.mock(url, 'GET', {
        request_time: requestTime,
        country: 'US',
      });

      expect(await classifyClient()).toEqual(jasmine.objectContaining({
        request_time: new Date(requestTime),
        country: 'US',
      }));
      expect(fetchMock.lastUrl()).toEqual(url);
    });
  });

  describe('filterContext', () => {
    it('should contain a valid user ID', async () => {
      document.documentElement.dataset.classifyUrl = '/api/v1/classify/';
      fetchMock.mock('/api/v1/classify/', 'GET', {
        request_time: '2016-01-01',
        country: 'US',
      });

      const driver = mockNormandy();
      const context = await filterContext(driver);
      expect(context.normandy.userId).toBeDefined();
      expect(UUID_ISH_REGEX.test(context.normandy.userId)).toBe(true);
    });
  });

  describe('doesRecipeMatch', () => {
    it('should include the recipe in the filter expression context', async () => {
      const recipe = {
        filter_expression: 'recipe.shouldPass',
        shouldPass: true,
      };

      let match = await doesRecipeMatch(recipe, {});
      expect(match[1]).toBe(true);

      // If shouldPass changes, so should the filter expression's result
      recipe.shouldPass = false;
      match = await doesRecipeMatch(recipe, {});
      expect(match[1]).toBe(false);
    });
  });
});
