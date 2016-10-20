/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm"); /* globals Services */
Cu.import("resource://gre/modules/TelemetryController.jsm"); /* globals TelemetryController */
Cu.import("resource://gre/modules/Timer.jsm"); /* globals setTimeout, clearTimeout */

Cu.importGlobalProperties(["URL"]); /* globals URL */

const {Log} = require("./Log.js");

const PREF_SURVEY_DURATION = "browser.uitour.surveyDuration";
const NOTIFICATION_TIME = 3000;

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
 * @param eventEmitter
 *        An EventEmitter instance to report status to.
 * @param {Object} options Options object.
 * @param {String} options.message
 *        The message, or question, to display on the notification.
 * @param {String} options.thanksMessage
 *        The thank you message to display after user votes.
 * @param {String} options.flowId
 *        An identifier for this rating flow. Please note that this is only used to
 *        identify the notification box.
 * @param {String} [options.engagementButtonLabel=null]
 *        The text of the engagement button to use instad of stars. If this is null
 *        or invalid, rating stars are used.
 * @param {String} [options.learnMoreMessage=null]
 *        The label of the learn more link. No link will be shown if this is null.
 * @param {String} [options.learnMoreUrl=null]
 *        The learn more URL to open when clicking on the learn more link. No learn more
 *        will be shown if this is an invalid URL.
 * @param {String} [options.surveyId]
 *        An ID for the survey, reflected in the Telemetry ping.
 * @param {Number} [options.surveyVersion]
 *        Survey's version number, reflected in the Telemetry ping.
 * @param {boolean} [options.testing]
 *        Whether this is a test survey, reflected in the Telemetry ping.
 * @param {Object} [options.sandbox]
 *        The sandbox this was called from.
 * @param {String} [options.postAnswerURL=null]
 *        The url to visit after the user answers the question.
 */
exports.Heartbeat = class {
  constructor(chromeWindow, eventEmitter, options) {
    if (typeof options.flowId !== "string") {
      throw new Error("flowId must be a string");
    }

    if (!options.flowId) {
      throw new Error("flowId must not be an empty string");
    }

    if (typeof options.message !== "string") {
      throw new Error("message must be a string");
    }

    if (!options.message) {
      throw new Error("message must not be an empty string");
    }

    if (options.postAnswerUrl) {
      options.postAnswerUrl = new URL(options.postAnswerUrl);
    } else {
      options.postAnswerUrl = null;
    }

    if (options.learnMoreUrl) {
      try {
        options.learnMoreUrl = new URL(options.learnMoreUrl);
      } catch (e) {
        options.learnMoreUrl = null;
      }
    }

    this.chromeWindow = chromeWindow;
    this.eventEmitter = eventEmitter
    this.options = options;

    this.surveyResults = {};

    this.buttons = null;

    if (this.options.engagementButtonLabel) {
      this.buttons = [{
        label: this.options.engagementButtonLabel,
        callback: () => {
          // Let the consumer know user engaged.
          this.maybeNotifyHeartbeat("Engaged");

          this.userEngaged({
            type: "button",
            flowId: this.options.flowId,
          });

          // Return true so that the notification bar doesn't close itself since
          // we have a thank you message to show.
          return true;
        },
      }];
    }

    this.notificationBox = this.chromeWindow.document.getElementById("high-priority-global-notificationbox");
    this.notice = this.notificationBox.appendNotification(
      this.options.message,
      "heartbeat-" + this.options.flowId,
      "chrome://browser/skin/heartbeat-icon.svg",
      this.notificationBox.PRIORITY_INFO_HIGH,
      this.buttons,
      eventType => {
        if (eventType !== "removed") {
          return;
        }
        this.maybeNotifyHeartbeat("NotificationClosed");
      }
    );

    // Holds the rating UI
    let frag = this.chromeWindow.document.createDocumentFragment();

    // Build the heartbeat stars
    if (!this.options.engagementButtonLabel) {
      const numStars = this.options.engagementButtonLabel ? 0 : 5;
      let ratingContainer = this.chromeWindow.document.createElement("hbox");
      ratingContainer.id = "star-rating-container";

      for (let i = 0; i < numStars; i++) {
        // create a star rating element
        let ratingElement = this.chromeWindow.document.createElement("toolbarbutton");

        // style it
        let starIndex = numStars - i;
        ratingElement.className = "plain star-x";
        ratingElement.id = "star" + starIndex;
        ratingElement.setAttribute("data-score", starIndex);

        // Add the click handler
        ratingElement.addEventListener("click", ev => {
          let rating = parseInt(ev.target.getAttribute("data-score"));
          this.maybeNotifyHeartbeat("Voted", {score: rating});
          this.userEngaged({type: "stars", score: rating, flowId: this.options.flowId});
        });

        ratingContainer.appendChild(ratingElement);
      }

      frag.appendChild(ratingContainer);
    }

    this.messageImage = this.chromeWindow.document.getAnonymousElementByAttribute(this.notice, "anonid", "messageImage");
    this.messageImage.classList.add("heartbeat", "pulse-onshow");

    this.messageText = this.chromeWindow.document.getAnonymousElementByAttribute(this.notice, "anonid", "messageText");
    this.messageText.classList.add("heartbeat");

    // Make sure the stars are not pushed to the right by the spacer.
    let rightSpacer = this.chromeWindow.document.createElement("spacer");
    rightSpacer.flex = 20;
    frag.appendChild(rightSpacer);

    // collapse the space before the stars
    this.messageText.flex = 0;
    let leftSpacer = this.messageText.nextSibling;
    leftSpacer.flex = 0;

    // Add Learn More Link
    if (this.options.learnMoreMessage && this.options.learnMoreUrl) {
      let learnMore = this.chromeWindow.document.createElement("label");
      learnMore.className = "text-link";
      learnMore.href = this.options.learnMoreUrl.toString();
      learnMore.setAttribute("value", this.options.learnMoreMessage);
      learnMore.addEventListener("click", () => this.maybeNotifyHeartbeat("LearnMore"));
      frag.appendChild(learnMore);
    }

    // Append the fragment and apply the styling
    this.notice.appendChild(frag);
    this.notice.classList.add("heartbeat");

    // Let the consumer know the notification was shown.
    this.maybeNotifyHeartbeat("NotificationOffered");

    let handleWindowClosed = () => {
      this.maybeNotifyHeartbeat("WindowClosed");
      this.chromeWindow.removeEventListener("SSWindowClosing", handleWindowClosed);
    };
    this.chromeWindow.addEventListener("SSWindowClosing", handleWindowClosed);

    let surveyDuration = Services.prefs.getIntPref(PREF_SURVEY_DURATION) * 1000;
    this.surveyEndTimer = setTimeout(() => {
      this.maybeNotifyHeartbeat("SurveyExpired");
      this.notificationBox.removeNotification(this.notice);
    }, surveyDuration);
  }

  maybeNotifyHeartbeat(name, data={}) {
    if (this.pingSent) {
      Log.warn("Heartbeat event recieved after Telemetry ping sent. name:", name, "data:", data);
      return;
    }

    let timestamp = Date.now();
    let sendPing = false;

    let phases = {
      NotificationOffered: () => {
        this.surveyResults.flowId = this.options.flowId;
        this.surveyResults.offeredTS = timestamp;
      },
      LearnMore: () => {
        if (!this.surveyResults.learnMoreTS) {
          this.surveyResults.learnMoreTS = timestamp;
        }
      },
      Engaged: () => {
        this.surveyResults.engagedTS = timestamp;
      },
      Voted: () => {
        this.surveyResults.votedTS = timestamp;
        this.surveyResults.score = data.score;
      },
      SurveyExpired: () => {
        this.surveyResults.expiredTS = timestamp;
      },
      NotificationClosed: () => {
        this.surveyResults.closedTS = timestamp;
        sendPing = true;
      },
      WindowClosed: () => {
        this.surveyResults.windowClosedTS = timestamp;
        sendPing = true;
      },
      default: () => {
        Log.error("Unrecognized Heartbeat event:", name);
      },
    };

    (phases[name] || phases.default)();

    data.timestamp = timestamp;
    data.flowId = this.options.flowId;
    this.eventEmitter.emit(name, data);

    if (!sendPing) {
      return;
    }

    // Send the ping to Telemetry
    let payload = Object.assign({version: 1}, this.surveyResults);
    for (let meta of ["surveyId", "surveyVersion", "testing"]) {
      if (this.options.hasOwnProperty(meta)) {
        payload[meta] = this.options[meta];
      }
    }

    TelemetryController.submitExternalPing("heartbeat", payload, {
      addClientId: true,
      addEnvironment: true,
    });

    // only for testing
    this.eventEmitteremit("TelemetrySent", Cu.cloneInto(payload, this.options.sandbox));

    // Survey is complete, clear out the expiry timer & survey configuration
    if (this.surveyEndTimer) {
      clearTimeout(this.surveyEndTimer);
      this.surveyEndTimer = null;
    }

    this.pingSent = true;
    this.surveyResults = null;
  }

  userEngaged(engagementParams) {
    // Make the heartbeat icon pulse twice
    this.notice.label = this.options.thanksMessage;
    this.messageImage.classList.remove("pulse-onshow");
    this.messageImage.classList.add("pulse-twice");

    // Remove all the children of the notice (rating container, and the flex)
    while (this.notice.firstChild) {
      this.notice.firstChild.remove();
    }

    // Just open the engagement tab if we have a valid engagement URL.
    if (this.options.postAnswerUrl) {
      // Open the engagement URL in a new tab.
      for (let key of engagementParams) {
        this.options.postAnswerUrl.searchParams.append(key, engagementParams[key]);
      }
      this.chromeWindow.gBrowser.selectedTab = this.chromeWindow.gBrowser.addTab(this.options.postAnswerUrl.toString());
    }

    if (this.surveyEndTimer) {
      clearTimeout(this.surveyEndTimer);
      this.surveyEndTimer = null;
    }

    setTimeout(() => {
      this.notificationBox.removeNotification(this.notice);
    }, NOTIFICATION_TIME);
  }
};
