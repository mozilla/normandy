import { Action, registerAction } from '../utils';

const VERSION = 54; // Increase when changed.
const LAST_SHOWN_DELAY = 1000 * 60 * 60 * 24 * 7; // 7 days


export class HeartbeatFlow {
  constructor(action) {
    this.action = action;
    const { normandy, recipe, client, location } = action;

    const flashPlugin = client.plugins['Shockwave Flash'];
    const plugins = {};
    for (const pluginName in client.plugins) {
      if (!client.plugins.hasOwnProperty(pluginName)) {
        continue;
      }
      const plugin = client.plugins[pluginName];
      plugins[plugin.name] = plugin.version;
    }

    this.data = {
      // Required fields
      response_version: 2,
      experiment_version: '-',
      person_id: 'NA',
      survey_id: recipe.arguments.surveyId,
      flow_id: normandy.uuid(),
      question_id: recipe.arguments.message.slice(0, 50),
      updated_ts: Date.now(),
      question_text: recipe.arguments.message,
      variation_id: recipe.revision_id.toString(),

      // Optional fields
      score: null,
      max_score: 5,
      flow_began_ts: Date.now(),
      flow_offered_ts: 0,
      flow_voted_ts: 0,
      flow_engaged_ts: 0,
      platform: 'UNK',
      channel: client.channel.slice(0, 50),
      version: client.version.slice(0, 50),
      locale: normandy.locale.slice(0, 50),
      country: (location.countryCode || 'unk').toLowerCase().slice(0, 4),
      build_id: '-',
      partner_id: '-',
      profile_age: 0,
      profile_usage: {},
      addons: {
        addons: [],
      },
      extra: {
        crashes: {},
        engage: [],
        numflows: 0,
        searchEngine: client.searchEngine,
        syncSetup: client.syncSetup,
        defaultBrowser: client.isDefaultBrowser,
        plugins,
        flashVersion: flashPlugin ? flashPlugin.version : undefined,
      },
      is_test: normandy.testing,
    };
  }

  get id() {
    return this.data.flow_id;
  }

  save() {
    this.data.updated_ts = Date.now();

    const { normandy } = this.action;
    normandy.saveHeartbeatFlow(this.data);
  }

  addLink(href, source) {
    this.data.extra.engage.push([Date.now(), href, source]);
  }

  setPhaseTimestamp(phase, timestamp) {
    const key = `flow_${phase}_ts`;
    if (key in this.data && this.data[key] === 0) {
      this.data[key] = timestamp;
    }
  }

  setScore(score) {
    this.data.score = score;
  }
}


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

    const flow = new HeartbeatFlow(this);
    flow.save();

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
      postAnswerUrl: this.annotatePostAnswerUrl({ url: postAnswerUrl, userId }),
      learnMoreMessage,
      learnMoreUrl,
      flowId: flow.id,
      surveyVersion: this.recipe.revision_id,
    };

    if (this.normandy.testing) {
      heartbeatData.testing = 1;
    }

    const heartbeat = await this.normandy.showHeartbeat(heartbeatData);

    heartbeat.on('NotificationOffered', data => {
      flow.setPhaseTimestamp('offered', data.timestamp);
      flow.save();
    });

    heartbeat.on('LearnMore', () => {
      flow.addLink(this.recipe.arguments.learnMoreUrl, 'notice');
      flow.save();
    });

    heartbeat.on('Voted', data => {
      flow.setScore(data.score);
      flow.setPhaseTimestamp('voted', data.timestamp);
      flow.save();
    });

    heartbeat.on('Engaged', data => {
      flow.setPhaseTimestamp('engaged', data.timestamp);
      flow.save();
    });

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
