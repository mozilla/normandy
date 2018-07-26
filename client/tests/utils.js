/* eslint-disable import/prefer-default-export */

let _recipeId = 0;
/**
 * Factory for creating recipe objects as returned by the API.
 */
export function recipeFactory(props = {}) {
  // If we leave arguments, it will overwrite itself below.
  const args = { ...props.arguments };
  delete props.arguments;

  return {
    id: _recipeId++,
    revision_id: 1,
    name: 'Test Recipe',
    enabled: false,
    extra_filter_expression: 'true',
    action: 'console-log',
    arguments: {
      surveyId: 'mysurvey',
      message: 'test message',
      engagementButtonLabel: '',
      thanksMessage: 'thanks!',
      postAnswerUrl: 'http://example.com',
      learnMoreMessage: 'Learn More',
      learnMoreUrl: 'http://example.com',
      repeatOption: 'once',
      ...args,
    },
    ...props,
  };
}
