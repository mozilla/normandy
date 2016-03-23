/**
 * Convenience wrapper around XMLHttpRequest.
 *
 * @param {String} method - HTTP method to use.
 * @param {String} url - URL to send the request to.
 * @param {Object} options - Optional arguments.
 * @param {Object} options.data - Request data as an Object; keys are
 *     used as parameter names, values as parameter values.
 * @param {Object} options.headers - Headers and values to set on the
 *     request.
 * @promise {XMLHttpRequest} The request after it has succeeded.
 * @rejects {XMLHttpRequest} The request after it has failed.
 */
function xhr(method, url, options={}) {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.addEventListener('load', e => {
            if (req.status >= 400) {
                reject(req);
            } else {
                resolve(req);
            }
        });
        req.open(method, url);

        let data = undefined;
        if (options.data) {
            req.setRequestHeader('Content-Type', 'application/json');
            data = JSON.stringify(options.data);
        }

        if (options.headers) {
            for (let key in options.headers) {
                req.setRequestHeader(key, options.headers[key]);
            }
        }

        req.send(data);
    });
}
xhr.get = xhr.bind(null, 'GET');
xhr.post = xhr.bind(null, 'POST');
