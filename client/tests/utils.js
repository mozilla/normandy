/**
 * Create a fetch-mock matcher that matches URLs based on their path
 * alone.
 * @param  {String} urlToMatch URL path to match against (including leading /)
 * @return {Function}          Function for use as a fetch-mock matcher.
 */
export function urlPathMatcher(path) {
  return url => {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname === path;
  };
}

/**
 * Factory for creating recipe objects as returned by the API.
 */
export function recipeFactory(props = {}) {
  // If we leave arguments, it will overwrite itself below.
  const args = props.arguments;
  delete props.arguments;

  return {
    id: 1,
    revision_id: 1,
    name: 'Test Recipe',
    enabled: false,
    filter_expression: 'true',
    action: 'console-log',
    arguments: {
      surveyId: 'mysurvey',
      message: 'test message',
      engagementButtonLabel: '',
      thanksMessage: 'thanks!',
      postAnswerUrl: 'http://example.com',
      learnMoreMessage: 'Learn More',
      learnMoreUrl: 'http://example.com',
      ...args,
    },
    ...props,
  };
}
