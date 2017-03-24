import { Action, registerAction } from '../utils';

/**
 * Enrolls a user in a preference experiment, in which we assign the user to an
 * experiment branch and modify a preference temporarily to measure how it
 * affects Firefox via Telemetry.
 */
export default class PreferenceExperimentAction extends Action {
  execute() {
    // Babel's async transform handles the promises in such a way that it tries
    // to call `then` on Promises from a privileged context. I'm not entirely
    // sure why, but it works fine if we use Promises directly.
    //
    // Once we remove self-repair support, we should be able to use native
    // async/await anyway, which solves the issue.
    const { slug, preferenceName, branches } = this.recipe.arguments;
    const experiments = this.normandy.preferenceExperiments;

    // Exit early if we're on an incompatible client.
    if (experiments === undefined) {
      this.normandy.log('Client does not support preference experiments, aborting.', 'warn');
      return Promise.resolve();
    }

    return experiments.has(slug).then(hasSlug => {
      // If the experiment doesn't exist yet, enroll!
      if (!hasSlug) {
        return this.chooseBranch(branches)
          .then(branch => experiments.start(slug, branch.slug, preferenceName, branch.value));
      }

      // If the experiment exists, and isn't expired, bump the lastSeen date.
      return experiments.get(slug).then(experiment => {
        if (experiment.expired) {
          this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'info');
          return true;
        }

        return experiments.markLastSeen(slug);
      });
    });
  }

  chooseBranch(branches) {
    // Stub, eventually will be replaced by a proper branch choice method.
    return Promise.resolve(branches[0]);
  }
}

registerAction('preference-experiment', PreferenceExperimentAction);
