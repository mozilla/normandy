const {Cu, Cc, Ci} = require('chrome');
Cu.import('resource://gre/modules/Task.jsm'); /* globals Task */
const {CanonicalJSON} = Cu.import('resource://gre/modules/CanonicalJSON.jsm');
const {prefs} = require('sdk/simple-prefs');

const {Http} = require('./Http.js');
const {Log} = require('./Log.js');

exports.NormandyApi = {
  apiCall(method, endpoint, data={}) {
    const api_url = prefs.api_url;
    let url = `${api_url}/${endpoint}`;
    method = method.toLowerCase();
    if (method === 'get') {
      let params = [];
      for (let key in data) {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
      }
      url += '?' + params.join('&');
      data = undefined;
    }
    const headers = {'Accept': 'application/json'};
    return Http[method]({url, data, headers});
  },

  get(endpoint, data) {
    return this.apiCall('get', endpoint, data);
  },

  post(endpoint, data) {
    return this.apiCall('post', endpoint, data);
  },

  fetchRecipes: Task.async(function* (filters={}) {
    const rawText = (yield this.get('recipe/signed/', filters)).text;
    const recipesWithSigs = JSON.parse(rawText);

    const verifiedRecipes = [];

    for (let {recipe, signature: {signature, x5u}} of recipesWithSigs) {
      const serialized = CanonicalJSON.stringify(recipe);
      if (rawText.indexOf(serialized) === -1) {
        throw new Error('Canonical recipe serialization does not match!');
      }

      let certChain = (yield Http.get({url: x5u})).text;
      let builtSignature = `x5u="${x5u}";p384ecdsa=${signature}`;

      const verifier = Cc['@mozilla.org/security/contentsignatureverifier;1']
        .createInstance(Ci.nsIContentSignatureVerifier);

      if (!verifier.verifyContentSignature(serialized, builtSignature, certChain, 'normandy.content-signature.mozilla.org')) {
        throw new Error('Recipe signature is not valid');
      } else {
        verifiedRecipes.push(recipe);
      }
    }

    Log.debug(`Fetched ${verifiedRecipes.length} recipes from the server:`, verifiedRecipes.map(r => r.name).join(', '));

    return verifiedRecipes;
  }),

  /**
   * Fetch metadata about this client determined by the server.
   * @return {object} Metadata specified by the server
   */
  classifyClient() {
    return this.get('classify_client/')
    .then(req => req.json)
    .then(clientData => {
      clientData.request_time = new Date(clientData.request_time);
      return clientData;
    });
  },

  fetchAction(name) {
    return this.get(`action/${name}/`).then(req => req.json);
  },
};
