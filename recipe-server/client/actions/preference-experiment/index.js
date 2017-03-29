import { Action, registerAction } from '../utils';

// If FINISHED is thrown from within the promise chain, it exits early.
const FINISHED = Symbol('finished');

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
    const { slug, preferenceName, branches, bucketCount } = this.recipe.arguments;
    const experiments = this.normandy.preferenceExperiments;

    // Exit early if we're on an incompatible client.
    if (experiments === undefined) {
      this.normandy.log('Client does not support preference experiments, aborting.', 'warn');
      return Promise.resolve();
    }

    // Check the sample buckets to see if this user qualifies for the experiment.
    const input = `${this.normandy.userId}-${slug}`;
    return this.normandy.bucketSample(input, 0, bucketCount, 100000).then(userQualifies => {
      if (!userQualifies) {
        this.normandy.log(
          'Client did not match the sample for this experiment, aborting.',
          'debug',
        );
        throw FINISHED;
      }

      return experiments.has(slug);
    }).then(hasSlug => {
      // If the experiment doesn't exist yet, enroll!
      if (!hasSlug) {
        return this.chooseBranch(branches)
          .then(branch => experiments.start(slug, branch.slug, preferenceName, branch.value));
      }

      // If the experiment exists, and isn't expired, bump the lastSeen date.
      return experiments.get(slug).then(experiment => {
        if (experiment.expired) {
          this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'info');
          throw FINISHED;
        }

        return experiments.markLastSeen(slug);
      });
    }).catch(err => {
      // FINISHED is a flag to exit early, not an error
      if (err !== FINISHED) {
        throw err;
      }
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
