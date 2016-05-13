import EventEmitter from 'wolfy87-eventemitter';


export class MockStorage {
    constructor() {
        this.data = {};
    }

    getItem(key) {
        let value = this.data[key];
        return Promise.resolve(value !== undefined ? value : null);
    }

    setItem(key, value) {
        this.data[key] = String(value);
        return Promise.resolve();
    }

    removeItem(key) {
        delete this.data[key];
        return Promise.resolve();
    }
}


export function pluginFactory(props={}) {
    return Object.assign({
        name: 'Plugin',
        description: 'A plugin',
        filename: '/tmp/fake/path',
        version: 'v1.0',
    }, props);
}


export function mockNormandy() {
    let normandy = {
        mock: {
            storage: new MockStorage(),
            heartbeatEmitter: new EventEmitter(),
            location: {
                countryCode: 'us',
            },
            client: {
                version: '41.0.1',
                channel: 'release',
                isDefaultBrowser: true,
                searchEngine: 'google',
                syncSetup: true,
                plugins: {},
            },
        },

        testing: false,
        locale: 'en-US',
        location() {
            return Promise.resolve(this.mock.location);
        },
        log() {
            return;
        },
        createStorage() {
            return this.mock.storage;
        },
        showHeartbeat() {
            return Promise.resolve(this.mock.heartbeatEmitter);
        },
        client() {
            return Promise.resolve(this.mock.client);
        },
        uuid() {
            return 'fake-uuid';
        },
        saveHeartbeatFlow() {
            return Promise.resolve();
        },
    };

    let toSpy = [
        'location',
        'log',
        'createStorage',
        'showHeartbeat',
        'client',
        'uuid',
        'saveHeartbeatFlow',
    ];
    for (let method of toSpy) {
        spyOn(normandy, method).and.callThrough();
    }

    return normandy;
}
