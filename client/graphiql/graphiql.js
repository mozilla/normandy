import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';

const csrftoken = document.cookie.replace(/(?:(?:^|.*;\s*)csrftoken-20170707\s*=\s*([^;]*).*$)|^.*$/, '$1');

// Defines a GraphQL fetcher using the fetch API.
function graphQLFetcher(graphQLParams) {
  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  return fetch(url, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    credentials: 'include',
    body: JSON.stringify(graphQLParams),
  }).then(response => response.text()).then(responseBody => {
    try {
      return JSON.parse(responseBody);
    } catch (error) {
      return responseBody;
    }
  });
}

ReactDOM.render(
  React.createElement(GraphiQL, { fetcher: graphQLFetcher }),
  document.getElementById('root'),
);
