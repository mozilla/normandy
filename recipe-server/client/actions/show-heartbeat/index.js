import { Action, registerAction } from '../utils';

const VERSION = 55; // Increase when changed.

const ONE_DAY = 1000 * 60 * 60 * 24; // 24 hours

// how much time should elapse between heartbeats?
const HEARTBEAT_THROTTLE = ONE_DAY;

export default class ShowHeartbeatAction extends Action {
  constructor(normandy, recipe) {
    super(normandy, recipe);

    // 'local' storage
    // (namespaced to recipe.id - only this heartbeat can access)
    this.storage = normandy.createStorage(recipe.id);

    // 'global' storage
    // (constant namespace - all heartbeats can access)
    this.heartbeatStorage = normandy.createStorage('normandy-heartbeat');

    this.updateLastInteraction = ::this.updateLastInteraction;
  }

  /**
   * Returns a surveyId value. If recipe calls
   * to include the Telemetry UUID value,
   * then the UUID is attached to the surveyId
   * in `<surveyId>::<userId>` format.
   *
   * @return {String} Survey ID, possibly with user UUID
   */
  generateSurveyId() {
    const {
      includeTelemetryUUID,
      surveyId,
    } = this.recipe.arguments;
    const { userId } = this.normandy;

    let value = surveyId;

    // should user ID stuff be sent to telemetry?
    if (includeTelemetryUUID && !!userId) {
      // alter the survey ID to include that UUID
      value = `${surveyId}::${userId}`;
    }

    return value;
  }

  /**
   * Returns a boolean indicating if a heartbeat has been shown recently.
   *
   * Checks the saved `lastShown` value against the current time
   * and returns if the time is under HEARTBEAT_THROTTLE milliseconds.
   *
   * @async
   * @return {Boolean}  Has any heartbeat been shown recently?
   */
  async heartbeatShownRecently() {
    const lastShown = await this.heartbeatStorage.getItem('lastShown');
    const timeSince = lastShown ? new Date() - lastShown : Infinity;

    // Return a boolean indicating if a heartbeat
    // has shown within the last HEARTBEAT_THROTTLE ms
    return timeSince < HEARTBEAT_THROTTLE;
  }

  /**
   * @async
   * @return {number}
   */
  async sinceLastShown() {
    const lastShown = await this.storage.getItem('lastShown');
    return lastShown ? Date.now() - lastShown : null;
  }

  /**
   * Checks when this survey was last shown,
   * and returns a boolean indicating if the
   * user has ever seen this survey or not.
   *
   * @async
   * @return {Boolean}  Has the survey ever been shown?
   */
  async hasShownBefore() {
    const lastShown = await this.sinceLastShown();
    // If no survey has been shown, lastShown will be falsey.
    return !!lastShown;
  }

  async shownWithinLastDays(days) {
    const sinceLastShown = await this.sinceLastShown();
    const daysAgo = ONE_DAY * days;

    return sinceLastShown && sinceLastShown <= daysAgo;
  }

  /**
   * @async
   * @return {number}
   */
  async sinceLastInteraction() {
    const lastInteraction = await this.storage.getItem('lastInteraction');
    return lastInteraction ? Date.now() - lastInteraction : null;
  }

  /**
   * Checks when the survey prompt last had
   * interaction from the user (if ever),
   * and returns a boolean indicating if the
   * user has ever had interaction
   *
   * @async
   * @return {Boolean}  Has the survey ever had interaction?
   */
  async hasHadInteraction() {
    const hadInteraction = await this.sinceLastInteraction();
    // If the user has not interacted with the heartbeat yet,
    // hadInteraction will be falsey.
    return !!hadInteraction;
  }

  /**
   * Checks the repeat argument for this recipe,
   * then determines if the recipe can be qualified as 'ran'.
   * This ultimately decides if the prompt is shown at all
   * to the end user.
   *
   * @return {boolean}        Has the heartbeat been shown?
   */
  async heartbeatHasRan() {
    let hasShown = false;
    const {
      repeatOption,
      repeatEvery,
    } = this.recipe.arguments;

    switch (repeatOption) {
      // `once` is one and done
      case 'once':
        hasShown = await this.hasShownBefore();
        break;

      // `nag` requires user interaction to go away
      case 'nag':
        hasShown = await this.hasHadInteraction();
        break;

      // `xdays` waits for `repeatEvery` days to show again
      case 'xdays':
        hasShown = await this.shownWithinLastDays(repeatEvery);
        break;

      default:
        break;
    }

    return hasShown;
  }

  /**
   * Main action function.
   *
   * Determines if the heartbeat should be shown,
   * and if so, does so. Also records last shown
   * times to local storage to track when any
   * heartbeat was last shown to the user.
   */
  async execute() {
    const {
      message,
      engagementButtonLabel,
      thanksMessage,
      postAnswerUrl,
      learnMoreMessage,
      learnMoreUrl,
    } = this.recipe.arguments;

    // Test mode skips the 'last shown' checks
    if (!this.normandy.testing && (
      await this.heartbeatShownRecently() &&
      await this.heartbeatHasRan()
    )) {
      return;
    }

    this.location = await this.normandy.location();
    this.client = await this.normandy.client();

    const { userId } = this.normandy;
    const surveyId = this.generateSurveyId();

    // A bit redundant but the action argument names shouldn't necessarily rely
    // on the argument names showHeartbeat takes.
    const heartbeatData = {
      surveyId,
      message,
      engagementButtonLabel,
      thanksMessage,
      learnMoreMessage,
      learnMoreUrl,
      postAnswerUrl: this.generatePostURL(postAnswerUrl, userId),
      // generate a new uuid for this heartbeat flow
      flowId: this.normandy.uuid(),
      surveyVersion: this.recipe.revision_id,
    };

    // Add a flag to the heartbeat data if in test mode
    if (this.normandy.testing) {
      heartbeatData.testing = 1;
    }

    const heartBeat = await this.normandy.showHeartbeat(heartbeatData);

    // Upon heartbeat interaction, we want to update the stored time
    heartBeat.on('Voted', this.updateLastInteraction);
    heartBeat.on('Engaged', this.updateLastInteraction);

    // Let the record show that a heartbeat has been displayed
    heartBeat.on('NotificationOffered', () => this.updateLastShown());
  }

  /**
   * Updates the local storage values of when a/this heartbeat
   * was last displayed to the user with the current time.
   */
  updateLastShown() {
    // update the 'personal' storage of this heartbeat
    this.storage.setItem('lastShown', Date.now());

    // also update the 'global' storage of all heartbeats
    this.heartbeatStorage.setItem('lastShown', Date.now());
  }

  updateLastInteraction() {
    this.storage.setItem('lastInteraction', Date.now());
  }

  /**
   * Gathers recipe action/message information, and formats the content into
   * URL-safe query params. This is used by generatePostURL to
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

  /**
   * Given a post-answer url (and optionally a userId), returns an
   * updated string with query params of relevant data for the
   * page the user will be directed to. Includes survey version,
   * google analytics params, etc.
   *
   * @param  {String} url     Post-answer URL (without query params)
   * @param  {String} userId? Optional, UUID to associate with user
   * @return {String}         URL with post-answer query params
   */
  generatePostURL(url, userId) {
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
    if (this.recipe.arguments.includeTelemetryUUID && userId) {
      args.userId = userId;
    }

    // Append testing parameter if in testing mode.
    if (this.normandy.testing) {
      args.testing = 1;
    }

    // create a URL object to append arguments to
    const annotatedUrl = new URL(url);
    for (const key in args) {
      if (!args.hasOwnProperty(key)) {
        continue;
      }
      // explicitly set the query param
      // (this makes our args URL-safe)
      annotatedUrl.searchParams.set(key, args[key]);
    }

    // return the address with encoded queries
    return annotatedUrl.href;
  }
}

registerAction('show-heartbeat', ShowHeartbeatAction);
