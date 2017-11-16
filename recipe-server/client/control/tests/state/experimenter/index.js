import faker from 'faker';

import { Factory } from 'control/tests/factory';

import { getInitialState } from 'control/state/app/experimenter/reducers';

export const INITIAL_STATE = {
  items: getInitialState(),
};

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')    // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-')    // Replace multiple - with single -
    .replace(/^-+/, '')      // Trim - from start of text
    .replace(/-+$/, '');     // Trim - from end of text
}

export default class ExperimentFactory extends Factory {
  getFields() {
    const projectName = faker.hacker.phrase();
    const projectSlug = slugify(projectName);
    const experimentName = faker.hacker.phrase();
    const experimentSlug = slugify(experimentName);
    const controlName = faker.hacker.phrase();
    const controlSlug = slugify(controlName);
    const variantName = faker.hacker.phrase();
    const variantSlug = slugify(variantName);

    return {
      name: experimentName,
      slug: experimentSlug,
      project_name: projectName,
      project_slug: projectSlug,
      experiment_slug: `${projectSlug}-${experimentSlug}`,
      objectives: faker.lorem.text(),
      population_percent: '50.0000',
      client_matching: 'Locales: en-US, en-CA, en-GB\nGeos: US, CA, GB\nSome \'additional\' filtering',
      firefox_channel: 'Beta',
      firefox_version: '57.0',
      pref_branch: 'user',
      pref_key: `browser.${faker.hacker.phrase()}.enabled`,
      pref_type: 'boolean',
      experiment_url: 'https://localhost/experiments/experiment/194/change/',
      accept_url: `https://localhost/api/v1/experiments/${experimentSlug}/accept`,
      reject_url: `https://localhost/api/v1/experiments/${experimentSlug}/reject`,
      start_date: 1505842158000.0,
      end_date: 1505842159000.0,
      control: {
        description: faker.lorem.text(),
        name: controlName,
        ratio: 6,
        slug: controlSlug,
        value: true,
      },
      variant: {
        description: faker.lorem.text(),
        name: variantName,
        ratio: 9,
        slug: variantSlug,
        value: false,
      },
    };
  }
}

export function createRecipeResponse(experiment) {
  const recipeData = {
    name: experiment.name,
    extra_filter_expression: experiment.client_matching,
    filter_expression: experiment.client_matching,
    id: 75,
    is_approved: false,
    last_updated: '2017-09-27T19:43:21.630936Z',
    arguments: {
      branches: [
        {
          ratio: experiment.control.ratio,
          slug: experiment.control.slug,
          value: experiment.control.value,
        },
        {
          ratio: experiment.variant.ratio,
          slug: experiment.variant.slug,
          value: experiment.variant.value,
        },
      ],
      experimentDocumentUrl: 'https://localhost/experiments/experiment/213/change/',
      preferenceBranchType: experiment.pref_branch,
      preferenceName: experiment.pref_key,
      preferenceType: experiment.pref_type,
      slug: experiment.experiment_slug,
    },
  };

  recipeData.latest_revision = { recipe: Object.assign({}, recipeData) };

  return recipeData;
}
