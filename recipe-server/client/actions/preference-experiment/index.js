import { Action, registerAction } from '../utils';

/**
 * Enrolls a user in a preference experiment, in which we assign the user to an experiment branch
 * and modify a preference temporarily to measure how it affects Firefox via Telemetry.
 */
export default class PreferenceExperimentAction extends Action {
  execute() {
    // Babel's async transform handles the promises in such a way that it tries to call `then`
    // on Promises from a privileged context. I'm not entirely sure why, but it works fine if we
    // use Promises directly.
    //
    // Once we remove self-repair support, we should be save to use native async/await anyway,
    // which solves the issue.
    return new Promise((resolve, reject) => {
      const { slug, preferenceName, branches } = this.recipe.arguments;
      const experiments = this.normandy.preferenceExperiments;

      // Exit early if we're on an incompatible client.
      if (experiments === undefined) {
        this.normandy.log('Client does not support preference experiments, aborting.', 'warn');
        return;
      }

      experiments.has(slug).then(hasSlug => {
        if (!hasSlug) {
          // If the experiment doesn't exist yet, enroll!
          this.chooseBranch(branches)
            .then(branch => experiments.start(slug, branch.slug, preferenceName, branch.value))
            .catch(reject);
        } else {
          // If the experiment exists, and isn't expired, bump the lastSeen date.
          experiments.get(slug).then(experiment => {
            if (experiment.expired) {
              this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'info');
              resolve();
            } else {
              experiments.markLastSeen(slug).then(resolve, reject);
            }
          }, reject);
        }
      }, reject);
    });
  }

  /**
   * Feature branches have a ratio defining how likely a user should be assigned
   * to that branch vs the other available branches. If we add those ratios
   * together and treat them as sampling buckets, we can generate a random
   * distribution of users that meets the desired ratios.
   */
  chooseBranch(branches) {
    return new Promise((resolve, reject) => {
      const slug = this.recipe.arguments.slug;
      const totalBuckets = branches.reduce((acc, branch) => acc + branch.ratio, 0);

      // It's important that the input be:
      // - Unique per-user (no one is bucketed alike)
      // - Unique per-experiment (bucketing differs across multiple experiments)
      // - Differs from the input used for sampling the recipe (otherwise only branches that
      //   contain the same buckets as the recipe sampling will receive users)
      const input = `${this.normandy.uuid()}-${slug}-branch`;

      // Annotate branches with their bucket index
      let currentBucket = 0;
      for (const branch of branches) {
        branch.bucket = currentBucket;
        currentBucket += branch.ratio;
      }

      // Run all branch checks together, and find the one that passed.
      const branchChecks = branches.map(branch => this.checkBranch(input, branch, totalBuckets));
      Promise.all(branchChecks).then(results => {
        const matches = results.filter(r => r !== null);
        if (matches.length === 1) {
          resolve(branches[0]);
        } else {
          // If the user matches more than one branch, or no branches, something
          // has gone wrong.
          reject(
            new Error(`User was matched to ${matches.length} branches in a preference experiment.`)
          );
        }
      });
    });
  }

  /**
   * Resolves with the given branch if the user matches its bucket, or null if
   * the user doesn't.
   */
  checkBranch(input, branch, totalBuckets) {
    return this.normandy.bucketSample(input, branch.bucket, branch.ratio, totalBuckets)
      .then(inBranch => {
        if (inBranch) {
          return branch;
        }
        return null;
      });
  }
}

registerAction('preference-experiment', PreferenceExperimentAction);
