import { Action, registerAction } from '../utils';

const VERSION = 55; // Increase when changed.

// how much time should elapse between heartbeats?
const HEARTBEAT_THROTTLE = 1000 * 60 * 60 * 24; // 24 hours

export default class ShowHeartbeatAction extends Action {
  constructor(normandy, recipe) {
    super(normandy, recipe);

    // 'local' storage
    // (namespaced to recipe.id - only this heartbeat can access)
    this.storage = normandy.createStorage(recipe.id);

    // 'global' storage
    // (constant namespace - all heartbeats can access)
    this.heartbeatStorage = normandy.createStorage('normandy-heartbeat');
  }

  /**
   * Calculates the number of milliseconds since the last heartbeat from any recipe
   * was shown. Returns a boolean indicating if a heartbeat has been shown recently.
   */
  async heartbeatShownRecently() {
    const lastShown = await this.heartbeatStorage.getItem('lastShown');
    const timeSince = lastShown ? new Date() - lastShown : Infinity;

    // Return a boolean indicating if a heartbeat
    // has shown within the last HEARTBEAT_THROTTLE ms
    return timeSince < HEARTBEAT_THROTTLE;
  }

  /**
   * Checks when this survey was last shown,
   * and returns a boolean indicating if the
   * user has seen this survey already or not.
   */
  async surveyHasShown() {
    const lastShown = await this.storage.getItem('lastShown');
    // If no survey has been shown, lastShown will be falsey.
    return !!lastShown;
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

    if (!this.normandy.testing && (
      await this.heartbeatShownRecently() ||
      await this.surveyHasShown()
    )) {
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

    // and save the 'global' record that a heartbeat just played
    this.setLastHeartbeatDate();
  }

  setLastShownDate() {
    // Returns a promise, but there's nothing to do if it fails.
    this.storage.setItem('lastShown', Date.now());
  }

  setLastHeartbeatDate() {
    this.heartbeatStorage.setItem('lastShown', Date.now());
  }

  async getLastShownDate() {
    const lastShown = await this.storage.getItem('lastShown');
    return Number.isNaN(lastShown) ? null : lastShown;
  }

  async getLastHeartbeatDate() {
    const lastShown = await this.heartbeatStorage.getItem('lastShown');
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
