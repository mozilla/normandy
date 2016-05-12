import {Action, registerAction, weightedChoose} from '../utils';

const VERSION = 52; // Increase when changed.
const LAST_SHOWN_DELAY = 1000 * 60 * 60 * 24 * 7; // 7 days


export class HeartbeatFlow {
    constructor(action) {
        this.action = action;
        let {normandy, recipe, survey, client, location} = action;

        let flashPlugin = client.plugins['Shockwave Flash'];
        let plugins = {};
        for (let pluginName in client.plugins) {
            let plugin = client.plugins[pluginName];
            plugins[plugin.name] = plugin.version;
        }

        this.data = {
            // Required fields
            response_version: 2,
            experiment_version: '-',
            person_id: 'NA',
            survey_id: recipe.arguments.surveyId,
            flow_id: normandy.uuid(),
            question_id: survey.message,
            updated_ts: Date.now(),
            question_text: survey.message,
            variation_id: recipe.revision_id.toString(),

            // Optional fields
            score: null,
            max_score: 5,
            flow_began_ts: Date.now(),
            flow_offered_ts: 0,
            flow_voted_ts: 0,
            flow_engaged_ts: 0,
            platform: 'UNK',
            channel: client.channel,
            version: client.version,
            locale: normandy.locale,
            country: (location.countryCode || 'unknown').toLowerCase(),
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
                plugins: plugins,
                flashVersion: flashPlugin ? flashPlugin.version : undefined,
                doNotTrack: navigator.doNotTrack === '1',
            },
            is_test: normandy.testing,
        };
    }

    get id() {
        return this.data.flow_id;
    }

    save() {
        this.data.updated_ts = Date.now();

        let {normandy} = this.action;
        normandy.saveHeartbeatFlow(this.data);
    }

    addLink(href, source) {
        this.data.extra.engage.push([Date.now(), href, source]);
    }

    setPhaseTimestamp(phase, timestamp) {
        let key = `flow_${phase}_ts`;
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
        let {surveys, defaults, surveyId} = this.recipe.arguments;

        let lastShown = await this.getLastShownDate();
        let shouldShowSurvey = (
            this.normandy.testing
            || lastShown === null
            || Date.now() - lastShown > LAST_SHOWN_DELAY
        );
        if (!shouldShowSurvey) {
            return;
        }

        this.location = await this.normandy.location();
        this.client = await this.normandy.client();
        this.survey = this.chooseSurvey(surveys, defaults);

        let flow = new HeartbeatFlow(this);
        flow.save();

        let extraTelemetryArgs = {
            surveyId: surveyId,
            surveyVersion: this.recipe.revision_id,
        };
        if (this.normandy.testing) {
            extraTelemetryArgs.testing = 1;
        }

        // A bit redundant but the action argument names shouldn't necessarily rely
        // on the argument names showHeartbeat takes.
        let heartbeat = await this.normandy.showHeartbeat({
            message: this.survey.message,
            engagementButtonLabel: this.survey.engagementButtonLabel,
            thanksMessage: this.survey.thanksMessage,
            flowId: flow.id,
            postAnswerUrl: await this.annotatePostAnswerUrl(this.survey.postAnswerUrl),
            learnMoreMessage: this.survey.learnMoreMessage,
            learnMoreUrl: this.survey.learnMoreUrl,
            extraTelemetryArgs: extraTelemetryArgs,
        });

        heartbeat.on('NotificationOffered', data => {
            flow.setPhaseTimestamp('offered', data.timestamp);
            flow.save();
        });

        heartbeat.on('LearnMore', () => {
            flow.addLink(this.survey.learnMoreUrl, 'notice');
            flow.save();
        });

        heartbeat.on('Voted', data => {
            flow.setScore(data.score);
            flow.setPhaseTimestamp('voted', data.timestamp);
            flow.save();
        });

        this.setLastShownDate();
    }

    setLastShownDate() {
        // Returns a promise, but there's nothing to do if it fails.
        this.storage.setItem('lastShown', Date.now());
    }

    async getLastShownDate() {
        let lastShown = Number.parseInt(await this.storage.getItem('lastShown'), 10);
        return Number.isNaN(lastShown) ? null : lastShown;
    }

    async annotatePostAnswerUrl(url) {
        let args = [
            ['source', 'heartbeat'],
            ['surveyversion', VERSION],
            ['updateChannel', this.client.channel],
            ['fxVersion', this.client.version],
        ];

        // Append testing parameter if in testing mode.
        if (this.normandy.testing) {
            args.push(['testing', 1]);
        }

        let params = args.map(([a, b]) => `${a}=${b}`).join('&');
        if (url.indexOf('?') !== -1) {
            url += '&' + params;
        } else {
            url += '?' + params;
        }

        return url;
    }

    /**
     * From the given list of surveys, choose one based on their relative
     * weights and return it.
     *
     * @param  {array}  surveys  Array of weighted surveys from the arguments
     *                           object.
     * @param  {object} defaults Default values for survey attributes if they aren't
     *                           specified.
     * @return {object}          The chosen survey, with the defaults applied.
     */
    chooseSurvey(surveys, defaults) {
        let finalSurvey = Object.assign({}, weightedChoose(surveys));
        for (let prop in defaults) {
            if (!finalSurvey[prop]) {
                finalSurvey[prop] = defaults[prop];
            }
        }

        return finalSurvey;
    }
}

registerAction('show-heartbeat', ShowHeartbeatAction);
