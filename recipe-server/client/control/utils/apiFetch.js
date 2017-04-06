/* global document, fetch, Headers */

const API_ROOT = '/api/v1/';

export default function apiFetch(url, options = {}) {
  let queryString = '';

  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json');
  headers.append('X-CSRFToken', document.getElementsByTagName('html')[0].dataset.csrf);

  const settings = {
    headers,
    credentials: 'same-origin',
    ...options,
  };

  // Convert `data` to `body` or querystring if necessary.
  if ('data' in settings) {
    if ('body' in settings) {
      throw new Error('Only pass one of `settings.data` and `settings.body`.');
    }

    const method = (settings.method || 'GET').toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
      settings.body = JSON.stringify(settings.data);
    } else {
      queryString = '?';
      Object.keys(settings.data).forEach(key => {
        queryString += `${key}=${encodeURIComponent(settings.data[key])}&`;
      });
      queryString.slice(0, -1);
    }

    delete settings.data;
  }

  return fetch(`${API_ROOT}${url}${queryString}`, settings)
    .then(response => Promise.all([response.ok, response.json()]))
    .catch(error => [false, { message: error.message }])
    .then(([ok, data]) => {
      if (!ok) {
        throw data;
      }
      return data;
    });
}
