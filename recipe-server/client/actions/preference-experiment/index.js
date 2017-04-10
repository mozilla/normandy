/* globals normandy */
import { Action, registerAction, registerAsyncCallback } from '../utils';

let seenExperimentNames = [];

/**
 * Used for unit tests only to reset action state.
 */
export function resetAction() {
  seenExperimentNames = [];
}

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
    const { slug, preferenceName, preferenceBranchType, branches } = this.recipe.arguments;
    const experiments = this.normandy.preferenceExperiments;

    // Exit early if we're on an incompatible client.
    if (experiments === undefined) {
      this.normandy.log('Client does not support preference experiments, aborting.', 'info');
      return Promise.resolve();
    }

    seenExperimentNames.push(slug);
    return experiments.has(slug).then(hasSlug => {
      // If the experiment doesn't exist yet, enroll!
      if (!hasSlug) {
        return this.chooseBranch(branches).then(branch =>
          experiments.start({
            name: slug,
            branch: branch.slug,
            preferenceName,
            preferenceValue: branch.value,
            preferenceBranchType,
          })
        );
      }

      // If the experiment exists, and isn't expired, bump the lastSeen date.
      return experiments.get(slug).then(experiment => {
        if (experiment.expired) {
          this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'debug');
          return true;
        }

        return experiments.markLastSeen(slug);
      });
    });
  }

  chooseBranch(branches) {
    const slug = this.recipe.arguments.slug;
    const ratios = branches.map(branch => branch.ratio);

    // It's important that the input be:
    // - Unique per-user (no one is bucketed alike)
    // - Unique per-experiment (bucketing differs across multiple experiments)
    // - Differs from the input used for sampling the recipe (otherwise only
    //   branches that contain the same buckets as the recipe sampling will
    //   receive users)
    const input = `${this.normandy.userId}-${slug}-branch`;

    return this.normandy.ratioSample(input, ratios).then(index => branches[index]);
  }
}
registerAction('preference-experiment', PreferenceExperimentAction);

/**
 * Finds active experiments that were not stored in the seenExperimentNames list
 * during action execution, and stop them.
 */
export function postExecutionHook(normandy) {
  // Exit early if we're on an incompatible client.
  if (normandy.preferenceExperiments === undefined) {
    normandy.log('Client does not support preference experiments, aborting.', 'info');
    return Promise.resolve();
  }

  // If any of the active experiments were not seen during a run, stop them.
  return normandy.preferenceExperiments.getAllActive().then(activeExperiments => {
    const stopPromises = [];
    for (const experiment of activeExperiments) {
      if (!seenExperimentNames.includes(experiment.name)) {
        stopPromises.push(normandy.preferenceExperiments.stop(experiment.name, true));
      }
    }
    return Promise.all(stopPromises);
  });
}
registerAsyncCallback('postExecution', postExecutionHook);
