import NormandyDriver from '../normandy_driver.js';

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

  describe('client', () => {
    it("should fetch the user's distribution ID from UITour", async () => {
      const uitour = {
        getConfiguration(config, cb) {
          if (config === 'appinfo') {
            cb({ distribution: 'funnelcake85' });
          } else {
            cb({});
          }
        },
      };
      const driver = new NormandyDriver(uitour);

      const client = await driver.client();
      expect(client.distribution).toEqual('funnelcake85');
    });
  });
});
