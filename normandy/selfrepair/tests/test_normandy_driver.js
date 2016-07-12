import NormandyDriver from '../static/js/normandy_driver.js';

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
});
