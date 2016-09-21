import fetchMock from 'fetch-mock';

import NormandyDriver from '../normandy_driver.js';
import { urlPathMatcher } from '../../tests/utils.js';

describe('Normandy Driver', () => {
  describe('showHeartbeat', () => {
    it('should pass all the required arguments to the UITour helper', async () => {
      const uitour = jasmine.createSpyObj('uitour', ['showHeartbeat']);
      const driver = new NormandyDriver(uitour);
      const options = {
        message: 'testMessage',
        thanksMessage: 'testThanks',
        flowId: 'testFlowId',
        postAnswerUrl: 'testPostAnswerUrl',
        learnMoreMessage: 'testLearnMoreMessage',
        learnMoreUrl: 'testLearnMoreUrl',
        engagementButtonLabel: 'testEngagementButtonLabel',
        surveyId: 'testSurveyId',
        surveyVersion: 'testSurveyVersion',
        testing: true,
      };

      await driver.showHeartbeat(options);
      expect(uitour.showHeartbeat).toHaveBeenCalledWith(
        options.message,
        options.thanksMessage,
        options.flowId,
        options.postAnswerUrl,
        options.learnMoreMessage,
        options.learnMoreUrl,
        jasmine.objectContaining({
          engagementButtonLabel: options.engagementButtonLabel,
          surveyId: options.surveyId,
          surveyVersion: options.surveyVersion,
          testing: options.testing,
        }),
      );
    });
  });

  describe('saveHeartbeatFlow', () => {
    const driver = new NormandyDriver();

    afterEach(() => {
      expect(fetchMock.calls().unmatched).toEqual([]);
      fetchMock.restore();
    });

    beforeEach(() => {
      fetchMock.get(urlPathMatcher('/api/v2/hb/'), 200);
    });

    it('should not POST data if in testing mode', async () => {
      driver.testing = true;
      await driver.saveHeartbeatFlow({
        flowId: '123456789',
      });

      expect(fetchMock.calls().matched.length).toEqual(0);
    });

    it('should POST flow data to input', async () => {
      driver.testing = false;
      await driver.saveHeartbeatFlow({
        flowId: '123456789',
      });

      expect(fetchMock.lastOptions()).toEqual({
        method: 'POST',
        body: '{"flowId":"123456789"}',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('client', () => {
    it("should fetch the user's config from UITour", async () => {
      const uitour = {
        getConfiguration(config, cb) {
          switch (config) {
            case 'sync':
              return cb({
                setup: false,
              });
            case 'appinfo':
              return cb({
                version: '50.0.2',
                defaultUpdateChannel: 'aurora',
                defaultBrowser: true,
                distribution: 'funnelcake85',
              });
            case 'selectedSearchEngine':
              return cb({ searchEngineIdentifier: 'Yahoo' });
            default:
              return cb({});
          }
        },
      };
      const driver = new NormandyDriver(uitour);
      const client = await driver.client();

      expect(client.syncSetup).toEqual(false);
      expect(client.distribution).toEqual('funnelcake85');
      expect(client.isDefaultBrowser).toEqual(true);
      expect(client.searchEngine).toEqual('Yahoo');
    });
  });

  describe('uuid', () => {
    it('returns a valid userID', () => {
      const UUID_ISH_REGEX = /^[a-f0-9-]{36}$/;
      const driver = new NormandyDriver();
      const uuid = driver.uuid();
      expect(UUID_ISH_REGEX.test(uuid)).toBe(true);
    });
  });

  describe('log', () => {
    const driver = new NormandyDriver();

    it('will not log debug level unless in testing mode', () => {
      spyOn(console, 'log');
      driver.testing = false;
      driver.log('lorem ipsum');
      expect(console.log.calls.count()).toEqual(0);
    });

    it('will log debug messages in testing mode', () => {
      spyOn(console, 'log');
      driver.testing = true;
      driver.log('lorem ipsum');
      driver.log('lorem ipsum dolor', 'debug');
      expect(console.log.calls.count()).toEqual(2);
    });

    it('will log an error if level is set to error', () => {
      spyOn(console, 'error');
      driver.log('lorem ipsum', 'error');
      expect(console.error.calls.count()).toEqual(1);
    });
  });
});
