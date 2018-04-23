import { createRecipe } from 'control/state/app/recipes/actions';
import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';


function callExperimenter(url, data) {
  const options = {
    method: 'PATCH',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(data),
  };
  return fetch(url, options);
}

export function getPendingExperimentsUrl(experimenterAPIUrl) {
  return `${experimenterAPIUrl}/experiments/?status=Pending`;
}

export function escapeClientMatching(experiment) {
  // TODO JEXL has no ability to add comment strings so we have to
  // massage the incoming client matching string into something it
  // will accept
  const cleanedMatching = experiment.client_matching.replace(/"/gm, "'").replace(/(\r\n|\n|\r)/gm, '" &&\n"');
  return `"TODO - CONVERT TO JEXL" &&
"Browser: ${parseFloat(experiment.population_percent)}% of Firefox ${experiment.firefox_version} ${experiment.firefox_channel}" &&
"${cleanedMatching}" &&
false`;
}

export function formatRecipe(immutableExperiment, action) {
  const experiment = immutableExperiment.toJS();
  const { control, variant } = experiment;
  return {
    action_id: action.get('id'),
    name: `${experiment.project_name}: ${experiment.name}`,
    extra_filter_expression: escapeClientMatching(experiment),
    arguments: {
      slug: experiment.experiment_slug,
      experimentDocumentUrl: experiment.experiment_url,
      preferenceName: experiment.pref_key,
      preferenceType: experiment.pref_type,
      preferenceBranchType: experiment.pref_branch,
      branches: [{
        slug: control.slug,
        value: control.value,
        ratio: control.ratio,
      }, {
        slug: variant.slug,
        value: variant.value,
        ratio: variant.ratio,
      }],
    },
  };
}

export function fetchExperiments(experimenterAPIUrl) {
  return async dispatch => {
    const experimentsResponse = await fetch(getPendingExperimentsUrl(experimenterAPIUrl));
    const experiments = await experimentsResponse.json();
    dispatch({
      type: EXPERIMENTS_RECEIVE,
      experiments,
    });
  };
}

export function acceptExperiment(experiment) {
  return async dispatch => {
    await callExperimenter(experiment.get('accept_url'));
    dispatch({
      type: EXPERIMENT_ACCEPTED,
      experiment,
    });
  };
}

export function importExperiment(experiment, action) {
  return async dispatch => {
    await dispatch(createRecipe(formatRecipe(experiment, action)));
    await dispatch(acceptExperiment(experiment));
  };
}

export function selectRejectedExperiment(experiment) {
  return dispatch => {
    dispatch({
      type: EXPERIMENT_SELECT_REJECTED,
      experiment,
    });
  };
}

export function rejectExperiment(experiment, reason) {
  return async dispatch => {
    await callExperimenter(experiment.get('reject_url'), { message: reason });
    await dispatch({
      type: EXPERIMENT_SELECT_REJECTED,
      experiment: null,
    });
    await dispatch({
      type: EXPERIMENT_REJECTED,
      experiment,
    });
  };
}
