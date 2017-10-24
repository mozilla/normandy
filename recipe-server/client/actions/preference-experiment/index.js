import { Action, registerAction, registerAsyncCallback } from '../utils';

const SHIELD_OPT_OUT_PREF = 'app.shield.optoutstudies.enabled';

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
  async execute() {
    const {
      branches,
      isHighPopulation,
      preferenceBranchType,
      preferenceName,
      preferenceType,
      slug,
    } = this.recipe.arguments;
    const experiments = this.normandy.preferenceExperiments;

    // Exit early if we're on an incompatible client.
    if (experiments === undefined) {
      this.normandy.log('Client does not support preference experiments, aborting.', 'info');
      return;
    }

    // Check opt-out preference
    const preferences = this.normandy.preferences;
    if (preferences && !preferences.getBool(SHIELD_OPT_OUT_PREF, false)) {
      this.normandy.log('User has opted-out of preference experiments, aborting.', 'info');
      return;
    }

    seenExperimentNames.push(slug);

    // If the experiment doesn't exist yet, enroll!
    const hasSlug = await experiments.has(slug);
    if (!hasSlug) {
      // If there's already an active experiment using this preference, abort.
      const activeExperiments = await experiments.getAllActive();
      const hasConflicts = activeExperiments.some(exp => exp.preferenceName === preferenceName);
      if (hasConflicts) {
        this.normandy.log(
          `Experiment ${slug} ignored; another active experiment is already using the
          ${preferenceName} preference.`, 'warn',
        );
        return;
      }

      // Otherwise, enroll!
      const branch = await this.chooseBranch(branches);
      const experimentType = isHighPopulation ? 'normandy-exp-highpop' : 'normandy-exp';
      await experiments.start({
        name: slug,
        branch: branch.slug,
        preferenceName,
        preferenceValue: branch.value,
        preferenceBranchType,
        preferenceType,
        experimentType,
      });
    } else {
      // If the experiment exists, and isn't expired, bump the lastSeen date.
      const experiment = await experiments.get(slug);
      if (experiment.expired) {
        this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'debug');
      } else {
        await experiments.markLastSeen(slug);
      }
    }
  }

  async chooseBranch(branches) {
    const slug = this.recipe.arguments.slug;
    const ratios = branches.map(branch => branch.ratio);

    // It's important that the input be:
    // - Unique per-user (no one is bucketed alike)
    // - Unique per-experiment (bucketing differs across multiple experiments)
    // - Differs from the input used for sampling the recipe (otherwise only
    //   branches that contain the same buckets as the recipe sampling will
    //   receive users)
    const input = `${this.normandy.userId}-${slug}-branch`;

    const index = await this.normandy.ratioSample(input, ratios);
    return branches[index];
  }
}
registerAction('preference-experiment', PreferenceExperimentAction);

/**
 * Finds active experiments that were not stored in the seenExperimentNames list
 * during action execution, and stop them.
 */
export async function postExecutionHook(normandy) {
  // Exit early if we're on an incompatible client.
  if (normandy.preferenceExperiments === undefined) {
    normandy.log('Client does not support preference experiments, aborting.', 'info');
    return;
  }

  // If any of the active experiments were not seen during a run, stop them.
  const activeExperiments = await normandy.preferenceExperiments.getAllActive();
  for (const experiment of activeExperiments) {
    if (!seenExperimentNames.includes(experiment.name)) {
      // eslint-disable-next-line no-await-in-loop
      await normandy.preferenceExperiments.stop(experiment.name, true);
    }
  }
}
registerAsyncCallback('postExecution', postExecutionHook);
