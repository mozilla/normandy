const {Cc, Ci, Cu} = require("chrome");
const {Request} = require('sdk/request');
Cu.importGlobalProperties(['Blob']);
Cu.import('resource://gre/modules/devtools/Console.jsm');


function request({url}) {
  return new Promise((resolve, reject) => {
    const req = Request({
      url,
      onComplete(response) {
        resolve(response);
      },
    });
    req.get();
  });
}

exports.runWorker = function() {
  const url = 'http://localhost:8000/injected.js';

  function fromWorker(evt) {
    console.log('from worker', evt);
  }

  request({url})
  .then(response => {
    const sandboxScript = response.text;
    const context = Cu.getGlobalForObject({});

    const sandbox = Cu.Sandbox(context, {
      sandboxPrototype: context,
      wantXrays: true,
    });
    sandbox.postMessage = fromWorker;

    try {
      Cu.evalInSandbox(sandboxScript, sandbox);
    } catch (err) {
      console.error('error evaluating', err);
    }
    console.log('on the outside');
    console.log('sandbox.onMessage:', sandbox.onMessage);
    console.log('from sandbox', sandbox.onMessage('oh hai'));

    Cu.nukeSandbox(sandbox);
  });
}
