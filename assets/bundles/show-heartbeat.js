/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./client/actions/show-heartbeat/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client/actions/show-heartbeat/index.js":
/*!************************************************!*\
  !*** ./client/actions/show-heartbeat/index.js ***!
  \************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ShowHeartbeatAction; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./client/actions/utils.js");


const VERSION = 56; // Increase when changed.

// 24 hours in milliseconds
const ONE_DAY = (1000 * 3600 * 24);

// how much time should elapse between heartbeats?
const HEARTBEAT_THROTTLE = ONE_DAY;

class ShowHeartbeatAction extends _utils__WEBPACK_IMPORTED_MODULE_0__["Action"] {
  constructor(normandy, recipe) {
    super(normandy, recipe);

    // 'local' storage
    // (namespaced to recipe.id - only this heartbeat can access)
    this.storage = normandy.createStorage(recipe.id);

    // 'global' storage
    // (constant namespace - all heartbeats can access)
    this.heartbeatStorage = normandy.createStorage('normandy-heartbeat');

    // context bindings
    this.updateLastInteraction = this.updateLastInteraction.bind(this);
    this.updateLastShown = this.updateLastShown.bind(this);
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
    const timeSince = lastShown
      ? new Date() - parseFloat(lastShown) : Infinity;

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
    return typeof lastShown !== 'undefined'
      ? parseFloat(lastShown) : null;
  }

  /**
   * Return whether this survey has been seen by the user before.

   * @async
   * @return {Boolean}
   */
  async hasShownBefore() {
    // Even if the stored date is unparsable due to weirdness in the user's
    // storage, if there's _something_ stored then we probably have shown at
    // least once.
    return await this.storage.getItem('lastShown') !== null;
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

    return typeof lastInteraction !== 'undefined'
      ? parseFloat(lastInteraction) : null;
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

    return typeof lastInteraction !== 'undefined'
      ? Date.now() - lastInteraction : null;
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
   * Checks the repeatOption argument for this recipe
   * and determines if the recipe has fully executed.
   *
   * Each `repeatOption` setting has different requirements
   * to consider the heartbeat as executed; `once` will appear to the
   * user once and never again, while `nag` may appear to the user multiple times
   * before it is interacted with and considers itself 'executed'.
   *
   * @return {boolean}   Has this recipe fulfilled its execution criteria?
   */
  async heartbeatHasExecuted() {
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
    return !this.normandy.testing
      && (
        // if a heartbeat has been shown in the past 24 hours
        await this.heartbeatShownRecently()
        // or this specific heartbeat has already ran
        || this.heartbeatHasExecuted()
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

Object(_utils__WEBPACK_IMPORTED_MODULE_0__["registerAction"])('show-heartbeat', ShowHeartbeatAction);


/***/ }),

/***/ "./client/actions/utils.js":
/*!*********************************!*\
  !*** ./client/actions/utils.js ***!
  \*********************************/
/*! exports provided: Action, registerAction, registerAsyncCallback */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Action", function() { return Action; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "registerAction", function() { return registerAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "registerAsyncCallback", function() { return registerAsyncCallback; });
class Action {
  constructor(normandy, recipe) {
    this.normandy = normandy;
    this.recipe = recipe;
  }
}

// Attempt to find the global registerAction, and fall back to a noop if it's
// not available.
const registerAction = (
  (global && global.registerAction)
  || (window && window.registerAction)
  || function registerAction() {}
);

// Same as above, for registerAsyncCallback
const registerAsyncCallback = (
  (global && global.registerAsyncCallback)
  || (window && window.registerAsyncCallback)
  || function registerAsyncCallback() {}
);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })

/******/ });
//# sourceMappingURL=show-heartbeat.js.map