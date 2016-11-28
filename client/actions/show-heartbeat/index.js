import { Action, registerAction } from '../utils';

const VERSION = 55; // Increase when changed.
const LAST_SHOWN_DELAY = 1000 * 60 * 60 * 24 * 7; // 7 days

export default class ShowHeartbeatAction extends Action {
  constructor(normandy, recipe) {
    super(normandy, recipe);
    this.storage = normandy.createStorage(recipe.id);
  }

  async execute() {
    const {
      surveyId,
      message,
      engagementButtonLabel,
      thanksMessage,
      postAnswerUrl,
      learnMoreMessage,
      learnMoreUrl,
    } = this.recipe.arguments;

    const lastShown = await this.getLastShownDate();
    const shouldShowSurvey = (
      this.normandy.testing
      || lastShown === null
      || Date.now() - lastShown > LAST_SHOWN_DELAY
    );
    if (!shouldShowSurvey) {
      return;
    }

    this.location = await this.normandy.location();
    this.client = await this.normandy.client();

    let userId;
    let heartbeatSurveyId = surveyId;

    // should user ID stuff be sent to telemetry?
    const { includeTelemetryUUID } = this.recipe.arguments;

    if (includeTelemetryUUID) {
      // get the already-defined UUID from normandy
      userId = this.normandy.userId;

      // if a userId exists,
      if (userId) {
        // alter the survey ID to include that UUID
        heartbeatSurveyId = `${surveyId}::${userId}`;
      }
    }

    // A bit redundant but the action argument names shouldn't necessarily rely
    // on the argument names showHeartbeat takes.
    const heartbeatData = {
      surveyId: heartbeatSurveyId,
      message,
      engagementButtonLabel,
      thanksMessage,
      postAnswerUrl: this.annotatePostAnswerUrl({
        url: postAnswerUrl,
        userId,
      }),
      learnMoreMessage,
      learnMoreUrl,
      flowId: this.normandy.uuid(),
      surveyVersion: this.recipe.revision_id,
    };

    if (this.normandy.testing) {
      heartbeatData.testing = 1;
    }

    await this.normandy.showHeartbeat(heartbeatData);
    this.setLastShownDate();
  }

  setLastShownDate() {
    // Returns a promise, but there's nothing to do if it fails.
    this.storage.setItem('lastShown', Date.now());
  }

  async getLastShownDate() {
    const lastShown = await this.storage.getItem('lastShown');
    return Number.isNaN(lastShown) ? null : lastShown;
  }

  /**
   * Gathers recipe action/message information, and formats the content into
   * URL-safe query params. This is used by this.annotatePostAnswerUrl to
   * inject Google Analytics params into the post-answer URL.
   *
   * @return {Object} Hash containing utm_ queries to append to post-answer URL
   */
  getGAParams() {
    let message = this.recipe.arguments.message || '';
    // remove spaces
    message = message.replace(/\s+/g, '');
    // escape what we can
    message = encodeURIComponent(message);

    // use a fake URL object to get a legit URL-ified URL
    const fakeUrl = new URL('http://mozilla.com');
    fakeUrl.searchParams.set('message', message);
    // pluck the (now encoded) message
    message = fakeUrl.search.replace('?message=', '');

    return {
      utm_source: 'firefox',
      utm_medium: this.recipe.action, // action name
      utm_campaign: message, // 'shortenedmesssagetext'
    };
  }

  annotatePostAnswerUrl({ url, userId }) {
    // Don't bother with empty URLs.
    if (!url) {
      return url;
    }

    const args = {
      source: 'heartbeat',
      surveyversion: VERSION,
      updateChannel: this.client.channel,
      fxVersion: this.client.version,
      isDefaultBrowser: this.client.isDefaultBrowser ? 1 : 0,
      searchEngine: this.client.searchEngine,
      syncSetup: this.client.syncSetup ? 1 : 0,
      // Google Analytics parameters
      ...this.getGAParams(),
    };

    // if a userId is given,
    // we'll include it with the data passed through
    // to SurveyGizmo (via query params)
    if (userId) {
      args.userId = userId;
    }

    // Append testing parameter if in testing mode.
    if (this.normandy.testing) {
      args.testing = 1;
    }

    const annotatedUrl = new URL(url);
    for (const key in args) {
      if (!args.hasOwnProperty(key)) {
        continue;
      }
      annotatedUrl.searchParams.set(key, args[key]);
    }

    return annotatedUrl.href;
  }
}

registerAction('show-heartbeat', ShowHeartbeatAction);
