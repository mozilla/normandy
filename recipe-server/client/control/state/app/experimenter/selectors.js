export function getExperiments(state) {
  return state.app.experiments.items;
}

export function getRejectedExperiment(state) {
  return state.app.experiments.rejected;
}
