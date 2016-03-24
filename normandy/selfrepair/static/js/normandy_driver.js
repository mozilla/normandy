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
    get testing() {
        return new URL(window.location.href).searchParams.has('testing');
    },

    log(message, testOnly=true) {
        if (!(testOnly && !this.testing)) {
            console.log(message);
        }
    },

    uuid() {
        return uuid.v4();
    },

    createStorage(prefix) {
        return new LocalStorage(prefix);
    },

    getAppInfo() {
        return new Promise(resolve => {
            Mozilla.UITour.getConfiguration('appinfo', function(config) {
                resolve(config);
            });
        });
    },

    heartbeatCallbacks: [],
    showHeartbeat(options) {
        return new Promise((resolve, reject) => {
            // TODO: Validate arguments and reject if some are missing.
            this.heartbeatCallbacks[options.flowId] = () => {
                resolve();
            };

            Mozilla.UITour.showHeartbeat(
                options.message,
                options.thanksMessage,
                options.flowId,
                options.postAnswerUrl,
                options.learnMoreMessage,
                options.learnMoreUrl
            );
        });

    },
};
