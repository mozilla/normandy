import Ajv from 'ajv';
import json4MetaSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import PreferenceExperimentAction, {
  postExecutionHook,
  resetAction,
} from '../preference-experiment/';
import packageJson from '../preference-experiment/package.json';
import { recipeFactory } from '../../tests/utils';
import { MockStorage } from './utils';

function argumentsFactory(args) {
  return {
    slug: 'test',
    preferenceName: 'fake.preference',
    preferenceType: 'string',
    preferenceBranchType: 'default',
    branches: [
      { slug: 'test', value: 'foo', ratio: 1 },
    ],
    isHighPopulation: false,
    ...args,
  };
}

function preferenceExperimentFactory(args) {
  return recipeFactory({
    arguments: argumentsFactory(args),
  });
}

class MockPreferenceExperiments {
  constructor() {
    this.experiments = {};
  }

  async start({ name, branch, preferenceName, preferenceValue, preferenceType }) {
    this.experiments[name] = {
      name,
      branch,
      preferenceName,
      preferenceValue,
      preferenceType,
      expired: false,
      lastSeen: 'start',
    };
  }

  async stop(name) {
    this.experiments[name].expired = true;
  }

  async markLastSeen(name) {
    this.experiments[name].lastSeen = 'marked';
  }

  async get(name) {
    return this.experiments[name];
  }

  async getAllActive() {
    return Object.values(this.experiments).filter(e => e.expired === false);
  }

  async has(name) {
    return name in this.experiments;
  }
}

describe('Preference Experiment Schema', () => {
  const ajv = new Ajv();
  ajv.addMetaSchema(json4MetaSchema);
  ajv.addSchema(packageJson.normandy.argumentsSchema, 'prefexp');

  const invalidSlugs = [
    '  unallowed whitespace  ',
    'unallowed+special&characters',
    'no,commas,please',
    '',
  ];
  const validSlugs = [
    'singlewordisfine',
    'underscores_are_good',
    'so-are-dashes',
    '4nd-3v3n-numb3r5',
  ];

  it('should validate experiment slugs', () => {
    for (const slug of invalidSlugs) {
      const args = argumentsFactory({ slug });
      expect(ajv.validate('prefexp', args)).toBe(false);
    }

    for (const slug of validSlugs) {
      const args = argumentsFactory({ slug });
      expect(ajv.validate('prefexp', args)).toBe(true);
    }
  });

  it('should validate branch slugs', () => {
    for (const slug of invalidSlugs) {
      const args = argumentsFactory({ branches: [{ slug, value: 'foo', ratio: 2 }] });
      expect(ajv.validate('prefexp', args)).toBe(false);
    }

    for (const slug of validSlugs) {
      const args = argumentsFactory({ branches: [{ slug, value: 'foo', ratio: 2 }] });
      expect(ajv.validate('prefexp', args)).toBe(true);
    }
  });
});

describe('PreferenceExperimentAction', () => {
  let normandy;
  let storage;

  beforeEach(() => {
    storage = new MockStorage();
    normandy = {
      async ratioSample() {
        return 0;
      },
      createStorage: () => storage,
      userId: 'fake-userid',
      log: jasmine.createSpy('log'),
      preferenceExperiments: new MockPreferenceExperiments(),
      preferences: {
        getBool: jasmine.createSpy('getBool').and.returnValue(true),
      },
    };
    resetAction();
  });

  describe('execute', () => {
    it('should run without errors', async () => {
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory());
      await action.execute();
      await postExecutionHook(normandy);
    });

    it('should log and exit if the preferenceExperiments API is missing', async () => {
      delete normandy.preferenceExperiments;
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory());

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.log).toHaveBeenCalledWith(jasmine.any(String), 'info');
    });

    it('should log and exit if the user has opted out of experiments', async () => {
      normandy.preferences.getBool.and.returnValue(false);
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory());

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferences.getBool).toHaveBeenCalledWith(
        'app.shield.optoutstudies.enabled', false,
      );
      expect(normandy.log).toHaveBeenCalledWith(jasmine.any(String), 'info');
    });

    it('should enroll the user if they have never been in the experiment', async () => {
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
        preferenceName: 'fake.preference',
        preferenceBranchType: 'user',
        branches: [
          { slug: 'branch1', value: 'branch1', ratio: 1 },
          { slug: 'branch2', value: 'branch2', ratio: 1 },
        ],
      }));
      spyOn(action, 'chooseBranch').and.callFake(branches => Promise.resolve(branches[0]));

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferenceExperiments.start)
        .toHaveBeenCalledWith({
          name: 'test',
          branch: 'branch1',
          preferenceName: 'fake.preference',
          preferenceValue: 'branch1',
          preferenceBranchType: 'user',
          preferenceType: 'string',
          experimentType: 'exp',
        });
    });

    it('should mark the lastSeen date for the experiment if it is active', async () => {
      normandy.preferenceExperiments.experiments.test = { name: 'test', expired: false };
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
      }));
      spyOn(normandy.preferenceExperiments, 'markLastSeen').and.callThrough();

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferenceExperiments.markLastSeen).toHaveBeenCalledWith('test');
    });

    it('should do nothing if the experiment is expired', async () => {
      normandy.preferenceExperiments.experiments.test = { name: 'test', expired: true };
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
      }));
      spyOn(normandy.preferenceExperiments, 'markLastSeen').and.callThrough();

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferenceExperiments.markLastSeen).not.toHaveBeenCalled();
    });

    it('should do nothing if enrollment is paused', async () => {
      const recipe = preferenceExperimentFactory({ isEnrollmentPaused: true });
      const action = new PreferenceExperimentAction(normandy, recipe);
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferenceExperiments.start).not.toHaveBeenCalled();
    });

    it(
      'should stop active experiments not seen between the pre and post execution hooks',
      async () => {
        const seen = { name: 'seen', expired: false };
        const unseen = { name: 'unseen', expired: false };
        normandy.preferenceExperiments.experiments = { seen, unseen };

        const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
          slug: 'seen',
        }));
        await action.execute();
        await postExecutionHook(normandy);

        expect(seen.expired).toBe(false);
        expect(unseen.expired).toBe(true);
      },
    );

    it('should do nothing if the preference is already being actively tested', async () => {
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();
      normandy.preferenceExperiments.experiments.conflict = {
        name: 'conflict',
        preferenceName: 'conflict.pref',
        expired: false,
      };
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'unseen',
        preferenceName: 'conflict.pref',
      }));
      spyOn(action, 'chooseBranch').and.callFake(branches => Promise.resolve(branches[0]));

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.preferenceExperiments.start).not.toHaveBeenCalled();
      expect(normandy.log).toHaveBeenCalledWith(jasmine.any(String), 'warn');
    });

    it('should set the experiment type to "exp" when isHighPopulation is false', async () => {
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        isHighPopulation: false,
      }));

      await action.execute();

      expect(normandy.preferenceExperiments.start).toHaveBeenCalled();
      expect(normandy.preferenceExperiments.start.calls.argsFor(0)[0].experimentType).toEqual('exp');
    });

    it('should set the experiment type to "exp-highpop" when isHighPopulation is true', async () => {
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        isHighPopulation: true,
      }));

      await action.execute();

      expect(normandy.preferenceExperiments.start).toHaveBeenCalled();
      expect(normandy.preferenceExperiments.start.calls.argsFor(0)[0].experimentType).toEqual('exp-highpop');
    });
  });

  describe('chooseBranch', () => {
    it('should return the branch chosen by ratioSample', async () => {
      normandy.userId = 'fake-id';
      spyOn(normandy, 'ratioSample').and.returnValue(Promise.resolve(1));
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'exp-slug',
      }));

      const branch = await action.chooseBranch([
        { value: 'branch0', ratio: 1 },
        { value: 'branch1', ratio: 2 },
      ]);
      expect(normandy.ratioSample)
        .toHaveBeenCalledWith('fake-id-exp-slug-branch', [1, 2]);
      expect(branch).toEqual({ value: 'branch1', ratio: 2 });
    });
  });
});
