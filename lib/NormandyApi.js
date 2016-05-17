const {Cu} = require('chrome');
const {Http} = require('./Http.js');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */

exports.NormandyApi = {
  apiCall(method, endpoint, data={}) {
    const api_url = Preferences.get('extensions.recipeclient.api_url', null);
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
    return Http[method]({url, data, headers}).then(response => response.json);
  },

  get(endpoint, data) {
    return this.apiCall('get', endpoint, data);
  },

  post(endpoint, data) {
    return this.apiCall('post', endpoint, data);
  },

  fetchRecipes(filters={}) {
    return this.get('recipe/', filters);
  },

  /**
   * Fetch metadata about this client determined by the server.
   * @return {object} Metadata specified by the server
   */
  classifyClient() {
    return this.get('classify_client/')
    .then(clientData => {
      clientData.request_time = new Date(clientData.request_time);
      return clientData;
    });
  },

  fetchAction(name) {
    return this.get(`action/${name}/`);
  },
};
