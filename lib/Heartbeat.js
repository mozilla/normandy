const {Cu} = require('chrome');

Cu.import('resource://gre/modules/Services.jsm'); /* globals Services */
Cu.import('resource://gre/modules/TelemetryController.jsm'); /* globals TelemetryController */
Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout, clearTimeout */

Cu.importGlobalProperties(['URL']); /* globals URL */

const {Log} = require('./Log.js');
const {EventEmitter} = require('./EventEmitter.js');

const PREF_SURVEY_DURATION = 'browser.uitour.surveyDuration';

/**
 * Show the Heartbeat UI to request user feedback. This function reports back to the
 * caller using |notify|. The notification event name reflects the current status the UI
 * is in (either "Heartbeat:NotificationOffered", "Heartbeat:NotificationClosed",
 * "Heartbeat:LearnMore", "Heartbeat:Engaged", "Heartbeat:Voted",
 * "Heartbeat:SurveyExpired" or "Heartbeat:WindowClosed").
 * When a "Heartbeat:Voted" event is notified
 * the data payload contains a |score| field which holds the rating picked by the user.
 * Please note that input parameters are already validated by the caller.
 *
 * @param chromeWindow
 *        The chrome window that the heartbeat notification is displayed in.
 * @param {Object} options Options object.
 * @param {String} options.message
 *        The message, or question, to display on the notification.
 * @param {String} options.thankyouMessage
 *        The thank you message to display after user votes.
 * @param {String} options.flowId
 *        An identifier for this rating flow. Please note that this is only used to
 *        identify the notification box.
 * @param {String} [options.engagementButtonLabel=null]
 *        The text of the engagement button to use instad of stars. If this is null
 *        or invalid, rating stars are used.
 * @param {String} [options.engagementURL=null]
 *        The engagement URL to open in a new tab once user has engaged. If this is null
 *        or invalid, no new tab is opened.
 * @param {String} [options.learnMoreLabel=null]
 *        The label of the learn more link. No link will be shown if this is null.
 * @param {String} [options.learnMoreURL=null]
 *        The learn more URL to open when clicking on the learn more link. No learn more
 *        will be shown if this is an invalid URL.
 * @param {boolean} [options.privateWindowsOnly=false]
 *        Whether the heartbeat UI should only be targeted at a private window (if one exists).
 *        No notifications should be fired when this is true.
 * @param {String} [options.surveyId]
 *        An ID for the survey, reflected in the Telemetry ping.
 * @param {Number} [options.surveyVersion]
 *        Survey's version number, reflected in the Telemetry ping.
 * @param {boolean} [options.testing]
 *        Whether this is a test survey, reflected in the Telemetry ping.
 */
exports.Heartbeat = class {
  constructor(chromeWindow, options) {
    Log.debug('Showing new Heartbeat', options);
    this.chromeWindow = chromeWindow;
    this.options = options;

    this.events = new EventEmitter(this.options.sandbox);
    this.surveyResults = {};

    this.notificationBox = this.chromeWindow.document.querySelector('#high-priority-global-notificationbox');
    this.notice = this.notificationBox.appendNotification(
      this.options.message,
      'heartbeat-' + this.options.flowId,
      'chrome://browser/skin/heartbeat-icon.svg',
      this.notificationBox.PRIORITY_INFO_HIGH,
      null,
      eventType => {
        if (eventType !== 'removed') {
          return;
        }
        this.maybeNotifyHeartbeat('NotificationClosed');
      }
    );

    // Holds the rating UI
    let frag = this.chromeWindow.document.createDocumentFragment();

    // Build the heartbeat stars
    const numStars = 5;
    let ratingContainer = this.chromeWindow.document.createElement('hbox');
    ratingContainer.id = 'star-rating-container';

    for (let i = 0; i < numStars; i++) {
      // create a star rating element
      let ratingElement = this.chromeWindow.document.createElement('toolbarbutton');

      // style it
      let starIndex = numStars - i;
      ratingElement.className = 'plain star-x';
      ratingElement.id = 'star' + starIndex;
      ratingElement.setAttribute('data-score', starIndex);

      // Add the click handler
      ratingElement.addEventListener('click', ev => {
        let rating = parseInt(ev.target.getAttribute('data-score'));
        this.maybeNotifyHeartbeat('Voted', {score: rating});
        this.userEngaged({type: 'stars', score: rating, flowId: this.options.flowId});
      });

      ratingContainer.appendChild(ratingElement);
    }

    frag.appendChild(ratingContainer);

    if (this.options.learnMoreLabel && this.options.learnMoreURL) {
      let learnMore = this.chromeWindow.document.createElement('label');
      learnMore.className = 'text-link';
      learnMore.href = learnMore;
      learnMore.setAttribute('value', this.options.learnMoreLabel);
      learnMore.addEventListener('click', () => this.maybeNotifyHeartbeat('LearnMore'));
      frag.appendChild(learnMore);
    }

    this.messageImage = this.chromeWindow.document.getAnonymousElementByAttribute(this.notice, 'anonid', 'messageImage');
    this.messageImage.classList.add('heartbeat', 'pulse-onshow');

    this.messageText = this.chromeWindow.document.getAnonymousElementByAttribute(this.notice, 'anonid', 'messageText');
    this.messageText.classList.add('heartbeat');

    // Make sure the stars are not pushed to the right by the spacer.
    let rightSpacer = this.chromeWindow.document.createElement('spacer');
    rightSpacer.flex = 20;
    frag.appendChild(rightSpacer);

    // collapse the space before the stars
    this.messageText.flex = 0;
    let leftSpacer = this.messageText.nextSibling;
    leftSpacer.flex = 0;

    // Append the fragment and apply the styling
    this.notice.appendChild(frag);
    this.notice.classList.add('heartbeat');

    // Let the consumer know the notification was shown.
    this.maybeNotifyHeartbeat('NotificationOffered');

    let handleWindowClosed = () => {
      this.maybeNotifyHeartbeat('WindowClosed');
      this.chromeWindow.removeEventListener('SSWindowClosing', handleWindowClosed);
    };
    this.chromeWindow.addEventListener('SSWindowClosing', handleWindowClosed);

    let surveyDuration = Services.prefs.getIntPref(PREF_SURVEY_DURATION) * 1000;
    this.surveyEndTimer = setTimeout(() => {
      this.maybeNotifyHeartbeat('SurveyExpired');
      this.notificationBox.removeNotification(this.notice);
    }, surveyDuration);
  }

  maybeNotifyHeartbeat(name, data={}) {
    Log.log('heartbeat event', name, data);

    if (this.pingSent) {
      Log.warn('Heartbeat event recieved after Telemetry ping sent. name:', name, 'data:', data);
    }

    let timestamp = Date.now();
    let sendPing = false;

    switch (name) {
      case 'NotificationOffered':
        this.surveyResults.flowId = this.options.flowId;
        this.surveyResults.offeredTS = timestamp;
        break;
      case 'LearnMore':
        if (!this.surveyResults.learnMoreTS) {
          this.surveyResults.learnMoreTS = timestamp;
        }
        break;
      case 'Engaged':
        this.surveyResults.engagedTS = timestamp;
        break;
      case 'Voted':
        this.surveyResults.votedTS = timestamp;
        this.surveyResults.score = data.score;
        break;
      case 'SurveyExpired':
        this.surveyResults.expiredTS = timestamp;
        break;
      case 'NotificationClosed':
        this.surveyResults.closedTS = timestamp;
        sendPing = true;
        break;
      case 'WindowClosed':
        this.surveyResults.windowClosedTS = timestamp;
        sendPing = true;
        break;
      default:
        Log.error('Unrecognized Heartbeat event:', name);
        break;
    }

    data.timestamp = timestamp;
    data.flowId = this.options.flowId;
    this.events.emit(name, data);

    if (!sendPing) {
      return;
    }

    // Send the ping to Telemetry
    let payload = Object.assign({version: 1}, this.surveyResults);
    for (let meta of ['surveyId', 'surveyVersion', 'testing']) {
      if (this.options.hasOwnProperty(meta)) {
        payload[meta] = this.options[meta];
      }
    }

    Log.debug('Sending payload to Telemetry: name:', name, 'payload:', payload);

    TelemetryController.submitExternalPing('heartbeat', payload, {
      addClientId: true,
      addEnvironment: true,
    });

    // only for testing
    this.events.emit('TelemetrySent', payload);

    // Survey is complete, clear out the expiry timer & survey configuration
    if (this.surveyEndTimer) {
      clearTimeout(this.surveyEndTimer);
      this.surveyEndTimer = null;
    }

    this.pingSent = true;
    this.surveyResults = null;
  }

  userEngaged(/* engagementParams */) {
    // Make the heartbeat icon pulse twice
    this.notice.label = this.options.thankyouMessage;
    this.messageImage.classList.remove('pulse-onshow');
    this.messageImage.classList.add('pulse-twice');

    // Remove all the children of the notice (rating container, and the flex)
    while (this.notice.firstChild) {
      this.notice.removeChild(this.notice.firstChild);
    }

    setTimeout(() => {
      this.notificationBox.removeNotification(this.notice);
    }, 3000);
  }
};
