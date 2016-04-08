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

  request({
    method,
    url,
    acceptNon200: acceptNon200=false,
    headers: headers={},
    data: data=null,
  }) {
    return new Promise((resolve, reject) => {
      let opts = {
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
      };

      if (data !== null) {
        opts.content = JSON.stringify(data);
        opts.contentType = 'application/json';
      }

      new Request(opts)[method]();
    });
  },
};
