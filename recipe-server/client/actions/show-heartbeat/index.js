import { Action, registerAction } from '../utils';

const VERSION = 56; // Increase when changed.

// 24 hours in milliseconds
const ONE_DAY = (1000 * 3600 * 24);

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

    // context bindings
    this.updateLastInteraction = ::this.updateLastInteraction;
    this.updateLastShown = ::this.updateLastShown;
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
    const timeSince = lastShown ?
      new Date() - parseFloat(lastShown) : Infinity;

    // Return a boolean indicating if a heartbeat
    // has shown within the last HEARTBEAT_THROTTLE ms
    return timeSince < HEARTBEAT_THROTTLE;
  }

  /**
   * Looks up the time the prompt was last displayed to the user,
   * and converts it to a Number (if found).
   *
   * @async
   * @return {number}   Timestamp of last prompt showing
   */
  async getLastShown() {
    const lastShown = await this.storage.getItem('lastShown');
    return typeof lastShown !== 'undefined' ?
      parseFloat(lastShown) : null;
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
    const lastShown = await this.getLastShown();
    // If no survey has been shown, lastShown will be falsey.
    return !!lastShown;
  }

  /**
   * Determines if this heartbeat was shown
   * at least x days ago.
   *
   * @param  {Number}  days Days ago to check
   * @return {boolean}      Has prompt been shown by that date?
   */
  async shownAtleastDaysAgo(days) {
    const hasShown = await this.hasShownBefore();

    if (!hasShown) {
      return false;
    }

    // get timestamp of last shown
    const timeLastShown = await this.getLastShown();

    // get the difference between now and then
    const timeElapsed = Date.now() - timeLastShown;

    // time limit is the number of days passed in
    // converted into milliseconds
    const timeLimit = ONE_DAY * days;

    // if the diff is smaller than the limit,
    // that means that the last time the user saw the prompt
    // was less than the `days` passed in
    return timeElapsed < timeLimit;
  }

  /**
   * Simple function to read the lastInteraction
   * timestamp (if any) from local storage.
   * @return {number}   Timestamp of last prompt interaction (if any)
   */
  async getLastInteraction() {
    const lastInteraction = await this.storage.getItem('lastInteraction');

    return typeof lastInteraction !== 'undefined' ?
      parseFloat(lastInteraction) : null;
  }

  /**
   * Gets the timestamp of the last prompt interaction,
   * and returns the time (in ms) since then.
   *
   * @async
   * @return {number}
   */
  async sinceLastInteraction() {
    const lastInteraction = await this.getLastInteraction();

    return typeof lastInteraction !== 'undefined' ?
      Date.now() - lastInteraction : null;
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
    const lastInteraction = await this.getLastInteraction();
    return !!lastInteraction;
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
      default:
      case 'once':
        hasShown = await this.hasShownBefore();
        break;

      // `nag` requires user interaction to go away
      case 'nag':
        hasShown = await this.hasHadInteraction();
        break;

      // `xdays` waits for `repeatEvery` days to show again
      case 'xdays':
        hasShown = await this.shownAtleastDaysAgo(repeatEvery);
        break;
    }

    return hasShown;
  }

  /**
   * Returns a boolean if the heartbeat should
   * fall out of `execute` or not. Checks
   * `testing` mode, and if heartbeats have
   * been shown lately.
   *
   * @return {boolean}  Should the recipe execution halt?
   */
  async shouldNotExecute() {
    return !this.normandy.testing &&
      (
        // if a heartbeat has been shown in the past 24 hours
        await this.heartbeatShownRecently() ||
        // or this specific heartbeat has already ran
        await this.heartbeatHasRan()
      );
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

    // determine if this should even run
    if (await this.shouldNotExecute()) {
      return;
    }

    this.location = await this.normandy.location();
    this.client = await this.normandy.client();

    // pull some data to attach to the telemetry business
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

    // show the prompt!
    const heartBeat = await this.normandy.showHeartbeat(heartbeatData);

    // list of events that the heartBeat will trigger
    // based on the user's interaction with the browser chrome
    const interactionEvents = ['Voted', 'Engaged'];

    // Upon heartbeat interaction, we want to update the stored time
    interactionEvents.forEach(event => {
      heartBeat.on(event, this.updateLastInteraction);
    });

    // Let the record show that a heartbeat has been displayed
    this.updateLastShown();
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

  /**
   * Updates the local storage value of when this heartbeat
   * received an interaction event from
   */
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
