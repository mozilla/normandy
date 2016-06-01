/* Redux forms with complex/nested data structures require
 * a specialized fields array to handle objects and arrays.
 * Eg: ['surveyId', 'surveys[].title', 'defaults.thankYouMessage']
 */
const reduxFormFields = {
  'console-log': ['message'],
  'show-heartbeat': [
    'surveyId',
    'defaults.message', 'defaults.engagementButtonLabel', 'defaults.thanksMessage',
    'defaults.postAnswerUrl', 'defaults.learnMoreMessage', 'defaults.learnMoreUrl',
    'surveys[].title', 'surveys[].message', 'surveys[].engagementButtonLabel', 'surveys[].thanksMessage',
    'surveys[].postAnswerUrl','surveys[].learnMoreMessage', 'surveys[].learnMoreUrl', 'surveys[].weight'
  ]
}

function formatLabel(labelName) {
  return labelName.replace( /([A-Z])/g, " $1" );
}

export {
  reduxFormFields,
  formatLabel
}
