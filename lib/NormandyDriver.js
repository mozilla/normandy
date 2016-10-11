const {uuid} = require('sdk/util/uuid');
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource:///modules/ShellService.jsm'); /* globals ShellService: false */

const {Log} = require('./Log.js');
const {Storage} = require('./Storage.js');
const {EnvExpressions} = require('./EnvExpressions.js');
const {Http} = require('./Http.js');
const {Heartbeat} = require('./Heartbeat.js');

const actionLogger = Log.makeNamespace('actions');

// Spec: https://raw.githubusercontent.com/mozilla/normandy-actions/9d6406f21f9025602c87754209de9fd675cc4871/docs/driver.rst
exports.NormandyDriver = function(recipeRunner, sandbox, extraContext) {
  return {
    testing: true,

    get locale() {
      return Preferences.get('general.useragent.locale');
    },

    log(message, level='debug') {
      let levels = ['debug', 'info', 'warn', 'error'];
      if (levels.indexOf(level) === -1) {
        throw new Error(`Invalid log level "${level}"`);
      }
      actionLogger[level](message);
    },

    showHeartbeat(options) {
      Log.info(`Showing heartbeat prompt "${options.message}"`);
      let aWindow = Services.wm.getMostRecentWindow('navigator:browser');

      let heartbeat = new Heartbeat(aWindow, {
        message: options.message,
        thankyouMessage: options.thanksMessage,
        flowId: options.flowId,
        learnMoreMessage: options.learnMoreMessage,
        learnMoreURL: options.learnMoreUrl,
        engagementButtonLabel: options.engagementButtonLabel,
        postAnswerURL: options.postAnswerUrl,
        surveyId: options.surveyId,
        surveyVersion: options.surveyVersion,
        testing: this.testing,
        sandbox: sandbox,
      });

      recipeRunner.heartbeatNotifications.push(heartbeat);

      let sandboxedEvents = Cu.cloneInto(heartbeat.events, sandbox, {cloneFunctions: true});

      return sandbox.Promise.resolve(sandboxedEvents);
    },

    saveHeartbeatFlow(data) {
      let url;
      if (!this.testing) {
        url = 'https://input.mozilla.org/api/v2/hb/';
      } else {
        url = 'https://input.allizom.org/api/v2/hb/';
      }

      let headers = {Accept: 'application/json'};

      Log.debug('Sending heartbeat flow data to Input', data);

      // Make request to input
      let p = Http.post({url, data, headers})
      .then(response => {
        Log.log('Input response:', response.text);
        // Resolve undefined instead of passing the response down.
        return undefined;
      })
      .catch(response => {
        Log.error('Input response:', response.text);
        throw Cu.cloneInto(response, sandbox, {cloneFunctions: false});
      });
      // Wrap the promise for the sandbox
      return sandbox.Promise.resolve(p);
    },

    client() {
      let appinfo = {
        version: Services.appinfo.version,
        channel: Services.appinfo.defaultUpdateChannel,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
        searchEngine: Services.search.defaultEngine.identifier,
        syncSetup: Services.prefs.prefHasUserValue('services.sync.username'),
        plugins: {}, // TODO
        doNotTrack: Services.prefs.getBoolPref('privacy.donottrackheader.enabled'),
      };
      appinfo = Cu.cloneInto(appinfo, sandbox);

      return sandbox.Promise.resolve(appinfo);
    },

    uuid() {
      let ret = uuid().toString();
      ret = ret.slice(1, ret.length - 1);
      return ret;
    },

    createStorage(keyPrefix) {
      let storage;
      try {
        storage = new Storage(keyPrefix, sandbox);
      } catch (e) {
        Log.error(e.stack);
        throw e;
      }
      return storage;
    },

    location() {
      let location = Cu.cloneInto({countryCode: extraContext.country}, sandbox);
      return sandbox.Promise.resolve(location);
    },

    envExpression(expr) {
      return EnvExpressions.eval(expr, extraContext);
    },
  };
};
