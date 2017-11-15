import * as Cookie from 'js-cookie';


export default class APIClient {
  static APIError = class APIError extends Error {
    constructor(message, data) {
      super(message);
      this.name = 'APIError';
      this.data = data;
    }
  }

  constructor(root = '/api/') {
    this.root = root;
  }

  async fetch(url, options) {
    let queryString = '';

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    if (!(options.body && options.body instanceof FormData)) {
      headers.append('Content-Type', 'application/json');
    }
    headers.append('X-CSRFToken', Cookie.get('csrftoken-20170707'));

    const settings = {
      headers,
      credentials: 'same-origin',
      method: 'GET',
      ...options,
    };

    // Convert `data` to `body` or querystring if necessary.
    if ('data' in settings) {
      if ('body' in settings) {
        throw new Error('Only pass one of `settings.data` and `settings.body`.');
      }

      if (['GET', 'HEAD'].includes(settings.method.toUpperCase())) {
        const queryStringData = Object.keys(settings.data).map(key => (
          `${key}=${encodeURIComponent(settings.data[key])}`
        ));
        queryString = `?${queryStringData.join('&')}`;
      } else {
        settings.body = JSON.stringify(settings.data);
      }

      delete settings.data;
    }

    const response = await fetch(`${this.root}${url}${queryString}`, settings);

    // Throw if we get a non-200 response.
    if (!response.ok) {
      let message;
      let data = {};
      let err;

      try {
        data = await response.json();
        message = data.detail || response.statusText;
      } catch (error) {
        message = error.message;
        err = error;
      }

      data = { ...data, status: response.status };

      throw new APIClient.APIError(message, data, err);
    }

    if (response.status !== 204) {
      return response.json();
    }

    return null;
  }
}
