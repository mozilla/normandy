/**
 * Storage class that uses window.localStorage as it's backing store.
 * @param {string} prefix Prefix to append to all incoming keys.
 */
function LocalStorage(prefix) {
    this.prefix = prefix;
}

Object.assign(LocalStorage.prototype, {
    _key(key) {
        return `${this.prefix}-${key}`;
    },

    getItem(key) {
        return new Promise(resolve => {
            resolve(localStorage.getItem(this._key(key)))
        });
    },

    setItem(key, value) {
        return new Promise(resolve => {
            localStorage.setItem(this._key(key), value);
            resolve();
        });
    },

    removeItem(key) {
        return new Promise(resolve => {
            localStorage.removeItem(this._key(key));
            resolve();
        });
    },
});


/**
 * Implementation of the Normandy driver.
 */
let Normandy = {
    locale: document.documentElement.dataset.locale || navigator.language,

    get testing() {
        return new URL(window.location.href).searchParams.has('testing');
    },

    _location: {countryCode: null},
    location() {
        return Promise.resolve(this._location);
    },

    log(message, level='debug') {
        if (level === 'debug' && !this.testing) {
            return;
        } else if (level === 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    },

    uuid() {
        return uuid.v4();
    },

    createStorage(prefix) {
        return new LocalStorage(prefix);
    },

    client() {
        return new Promise(resolve => {
            let client = {
                plugins: {}
            };

            // Populate plugin info.
            for (let plugin of navigator.plugins) {
                client.plugins[plugin.name] = {
                    name: plugin.name,
                    filename: plugin.filename,
                    description: plugin.description,
                    version: plugin.version,
                }
            }

            // Keys are UITour configs, functions are given the data
            // returned by UITour for that config.
            let wantedConfigs = {
                appinfo(data) {
                    client.version = data.version;
                    client.channel = data.defaultUpdateChannel;
                    client.isDefaultBrowser = data.defaultBrowser;
                },
                selectedSearchEngine(data) {
                    client.searchEngine = data.searchEngineIdentifier;
                },
                sync(data) {
                    client.syncSetup = data.setup;
                },
            };

            let retrievedConfigs = 0;
            let wantedConfigNames = Object.keys(wantedConfigs);
            wantedConfigNames.forEach(configName => {
                Mozilla.UITour.getConfiguration(configName, function(data) {
                    wantedConfigs[configName](data);
                    retrievedConfigs++;
                    if (retrievedConfigs >= wantedConfigNames.length) {
                        resolve(client);
                    }
                });
            });
        });
    },

    saveHeartbeatFlow(data) {
        if (this.testing) {
            this.log('Pretending to send flow to Input');
            this.log(data);
            return Promise.resolve({});
        } else {
            return xhr('POST', 'https://input.mozilla.org/api/v2/hb/', {
                data: data,
                headers: {Accept: 'application/json'},
            }).then(request => JSON.parse(request.responseText));
        }
    },

    heartbeatCallbacks: [],
    showHeartbeat(options) {
        return new Promise(resolve => {
            let emitter = new EventEmitter();
            this.heartbeatCallbacks[options.flowId] = function(eventName, data) {
                emitter.emit(eventName, data);
            };

            Mozilla.UITour.showHeartbeat(
                options.message,
                options.thanksMessage,
                options.flowId,
                options.postAnswerUrl,
                options.learnMoreMessage,
                options.learnMoreUrl
            );

            resolve(emitter);
        });

    },
};


// Trigger heartbeat callbacks when the UITour tells us that Heartbeat
// happened.
Mozilla.UITour.observe((eventName, data) => {
    if (eventName.startsWith('Heartbeat:')) {
        let flowId = data.flowId;
        eventName = eventName.slice(10); // Chop off "Heartbeat:"
        if (flowId in Normandy.heartbeatCallbacks) {
            Normandy.heartbeatCallbacks[flowId](eventName, data);
        }
    }
});
