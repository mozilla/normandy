const API_ROOT = '/api/';

export class ApiError extends Error {
  constructor(message, data) {
    super(message);
    this.name = 'ApiError';
    this.data = data;
  }
}

export default async function apiFetch(url, options = {}) {
  let queryString = '';

  const headers = new Headers();
  headers.append('Accept', 'application/json');
  if (!(options.body && options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }
  headers.append('X-CSRFToken', document.getElementsByTagName('html')[0].dataset.csrf);

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

  const response = await fetch(`${API_ROOT}${url}${queryString}`, settings);

  // Throw if we get a non-200 response.
  if (!response.ok) {
    let message;
    let data;

    try {
      data = await response.json();
      message = data.detail || response.statusText;
    } catch (error) {
      message = error.message;
    }

    throw new ApiError(message, data);
  }
  return response.json();
}
