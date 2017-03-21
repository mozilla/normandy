import PreferenceExperimentAction from '../preference-experiment/';
import { recipeFactory } from '../../tests/utils.js';

function preferenceExperimentFactory({ ...args }) {
  return recipeFactory({
    arguments: {
      slug: 'test',
      preferenceName: 'fake.preference',
      preferenceType: 'string',
      bucketCount: 10,
      branches: [
        { slug: 'test', value: 'foo', ratio: 1 },
      ],
      ...args,
    },
  });
}

class MockPreferenceExperiments {
  constructor() {
    this.experiments = {};
  }

  async start(name, branch, preferenceName, preferenceValue) {
    this.experiments[name] = {
      name,
      branch,
      preferenceName,
      preferenceValue,
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

  async has(name) {
    return name in this.experiments;
  }
}

describe('PreferenceExperimentAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = {
      async ratioSample() {
        return 0;
      },
      userId: 'fake-userid',
      log: jasmine.createSpy('log'),
      preferenceExperiments: new MockPreferenceExperiments(),
    };
  });

  describe('execute', () => {
    it('should run without errors', async () => {
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory());
      await action.execute();
    });

    it('should log and exit if the preferenceExperiments APi is missing', async () => {
      delete normandy.preferenceExperiments;
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory());
      await action.execute();
      expect(normandy.log).toHaveBeenCalledWith(jasmine.any(String), 'warn');
    });

    it('should enroll the user if they have never been in the experiment', async () => {
      spyOn(normandy.preferenceExperiments, 'start').and.callThrough();
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
        preferenceName: 'fake.preference',
        branches: [
          { slug: 'branch1', value: 'branch1', ratio: 1 },
          { slug: 'branch2', value: 'branch2', ratio: 1 },
        ],
      }));
      spyOn(action, 'chooseBranch').and.callFake(branches => Promise.resolve(branches[0]));

      await action.execute();
      expect(normandy.preferenceExperiments.start)
        .toHaveBeenCalledWith('test', 'branch1', 'fake.preference', 'branch1');
    });

    it('should mark the lastSeen date for the experiment if it is active', async () => {
      normandy.preferenceExperiments.experiments.test = { expired: false };
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
      }));
      spyOn(normandy.preferenceExperiments, 'markLastSeen').and.callThrough();

      await action.execute();
      expect(normandy.preferenceExperiments.markLastSeen).toHaveBeenCalledWith('test');
    });

    it('should do nothing if the experiment is expired', async () => {
      normandy.preferenceExperiments.experiments.test = { expired: true };
      const action = new PreferenceExperimentAction(normandy, preferenceExperimentFactory({
        slug: 'test',
      }));
      spyOn(normandy.preferenceExperiments, 'markLastSeen').and.callThrough();

      await action.execute();
      expect(normandy.preferenceExperiments.markLastSeen).not.toHaveBeenCalled();
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
