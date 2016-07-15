import fetchMock from 'fetch-mock';

import { classifyClient } from '../static/js/self_repair_runner.js';

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
});
