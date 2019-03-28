import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';

let csrftoken;
const cookies = (`; ${document.cookie}`).split('; csrftoken=');
if (cookies.length === 2) csrftoken = cookies.pop().split(';').shift();

// Collect the URL parameters
const parameters = {};

window.location.hash.substr(1).split('&').forEach(entry => {
  const eq = entry.indexOf('=');
  if (eq >= 0) {
    parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(entry.slice(eq + 1));
  }
});

// Produce a Location fragment string from a parameter object.
function locationQuery(params) {
  return `#${Object.keys(params).map(key => `${encodeURIComponent(key)}=${
    encodeURIComponent(params[key])}`).join('&')}`;
}

// Derive a fetch URL from the current URL, sans the GraphQL parameters.
const graphqlParamNames = {
  query: true,
  variables: true,
  operationName: true,
};

const otherParams = {};

for (const k in parameters) {
  if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
    otherParams[k] = parameters[k];
  }
}

const fetchURL = locationQuery(otherParams);

// Defines a GraphQL fetcher using the fetch API.
function graphQLFetcher(graphQLParams) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (csrftoken) {
    headers['X-CSRFToken'] = csrftoken;
  }
  return fetch(fetchURL, {
    method: 'post',
    headers,
    body: JSON.stringify(graphQLParams),
    credentials: 'include',
  }).then(response => response.text()).then(responseBody => {
    try {
      return JSON.parse(responseBody);
    } catch (error) {
      return responseBody;
    }
  });
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function onEditOperationName(newOperationName) {
  parameters.operationName = newOperationName;
  updateURL();
}

function updateURL() {
  window.history.replaceState(null, null, locationQuery(parameters));
}

const options = {
  fetcher: graphQLFetcher,
  onEditQuery,
  onEditVariables,
  onEditOperationName,
  query: parameters.query,
};

if (parameters.variables) {
  options.variables = parameters.variables;
}
if (parameters.operation_name) {
  options.operationName = parameters.operation_name;
}

ReactDOM.render(
  React.createElement(GraphiQL, options),
  document.body,
);
