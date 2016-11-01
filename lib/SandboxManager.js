const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm"); /* globals Services */

const {Log} = require("./Log.js");


exports.SandboxManager = class {
  constructor() {
    this._sandbox = makeSandbox();
    this.holds = [];
  }

  get sandbox() {
    if (this._sandbox !== null) {
      return this._sandbox;
    }
    throw new Error("Tried to use sandbox after it was nuked");
  }

  addHold(name) {
    this.holds.push(name);
  }

  removeHold(name) {
    let index = this.holds.indexOf(name);
    if (index === -1) {
      throw new Error(`Tried to remove non-existant hold "${name}"`);
    }
    this.holds.splice(index, 1);
    this.tryCleanup();
  }

  tryCleanup() {
    if (this.holds.length === 0) {
      let sandbox = this._sandbox;
      this._sandbox = null;
      Cu.nukeSandbox(sandbox);
    }
  }

  assertNuked(assert, done) {
    // Do this in a promise, so other async things can resolve.
    return new Promise(
      (resolve, reject) => {
        if (this._sandbox === null) {
          resolve();
        } else {
          reject(new Error(`Sandbox is not nuked. Holds left: ${this.holds}`));
        }
      })
      .catch(err => {
        assert.ok(false, err);
      })
      .then(done);
  }
};


function makeSandbox() {
  const sandbox = Cu.waiveXrays(new Cu.Sandbox(null, {
    wantComponents: false,
    wantGlobalProperties: ["URL", "URLSearchParams"],
  }));

  sandbox.window = Cu.cloneInto({}, sandbox);

  const url = "resource://shield-recipe-client/EventEmitter.js";
  Services.scriptloader.loadSubScript(url, sandbox);

  return sandbox;
}
