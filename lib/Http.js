const {Request} = require('sdk/request');

exports.Http = {
  get(opts) {
    opts = Object.assign({method: 'get'}, opts);
    return this.request(opts);
  },

  post(opts) {
    opts = Object.assign({method: 'post'}, opts);
    return this.request(opts);
  },

  request({method, url, acceptNon200: acceptNon200=false, headers: headers={}}) {
    return new Promise((resolve, reject) => {
      const req = new Request({
        url,
        headers,
        onComplete(response) {
          if (response === undefined) {
            reject('Response failed');
          }
          if (response.status === 0 || (!acceptNon200 && response.status >= 400)) {
            reject(response);
          } else {
            resolve(response);
          }
        },
      });

      req[method]();
    });
  },
};
