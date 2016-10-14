/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

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
          if (response.status === 0 || response.status >= 400) {
            const err = new Error('Failed HTTP resonse');
            err.response = response;
            reject(err);
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
