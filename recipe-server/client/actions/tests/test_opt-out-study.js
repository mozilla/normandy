import OptOutStudyAction, {
  postExecutionHook,
  resetAction,
} from '../opt-out-study/';
import { recipeFactory } from '../../tests/utils';

function argumentsFactory(args) {
  return {
    name: 'Fake Study',
    description: 'not real',
    addonUrl: 'http://example.com/addon.xpi',
    isEnrollmentPaused: false,
    ...args,
  };
}

function optOutStudyFactory(args) {
  return recipeFactory({
    arguments: argumentsFactory(args),
  });
}

class MockStudies {
  constructor() {
    this.studies = {};
  }

  async start({ recipeId, name, description, addonUrl }) {
    this.studies[recipeId] = {
      recipeId,
      name,
      active: true,
      description,
      addonId: 'fake@example.com',
      addonUrl,
      addonVersion: '1.0',
      studyStartDate: new Date(),
      studyEndDate: null,
    };
  }

  async stop(name) {
    this.studies[name].active = false;
  }

  async get(recipeId) {
    return this.studies[recipeId];
  }

  async getAll() {
    return Object.values(this.studies);
  }

  async has(recipeId) {
    return recipeId in this.studies;
  }
}

describe('OptOutStudyAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = {
      log: jasmine.createSpy('log'),
      studies: new MockStudies(),
    };
    resetAction();
  });

  describe('execute', () => {
    it('should run without errors', async () => {
      const action = new OptOutStudyAction(normandy, optOutStudyFactory());
      await action.execute();
      await postExecutionHook(normandy);
    });

    it('should log and exit if the studies API is missing', async () => {
      delete normandy.studies;
      const action = new OptOutStudyAction(normandy, optOutStudyFactory());

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.log).toHaveBeenCalledWith(jasmine.any(String), 'info');
    });

    it('should enroll the user if they have never been in the study', async () => {
      spyOn(normandy.studies, 'start').and.callThrough();
      const recipe = optOutStudyFactory({
        name: 'Fake Study',
        description: 'not real',
        addonUrl: 'http://example.com/addon.xpi',
      });
      const action = new OptOutStudyAction(normandy, recipe);

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.studies.start)
        .toHaveBeenCalledWith({
          recipeId: recipe.id,
          name: 'Fake Study',
          description: 'not real',
          addonUrl: 'http://example.com/addon.xpi',
        });
    });

    it('should do nothing if the study already exists', async () => {
      const recipe = optOutStudyFactory();
      await normandy.studies.start({
        recipeId: recipe.id,
        name: recipe.arguments.name,
        description: recipe.arguments.description,
        addonUrl: recipe.arguments.addonUrl,
      });

      const action = new OptOutStudyAction(normandy, recipe);
      spyOn(normandy.studies, 'start').and.callThrough();

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.studies.start).not.toHaveBeenCalled();
    });

    it('should do nothing if enrollment is paused', async () => {
      const recipe = optOutStudyFactory({ isEnrollmentPaused: true });
      const action = new OptOutStudyAction(normandy, recipe);
      spyOn(normandy.studies, 'start').and.callThrough();

      await action.execute();
      await postExecutionHook(normandy);

      expect(normandy.studies.start).not.toHaveBeenCalled();
    });

    it(
      'should stop active studies not seen between the pre and post execution hooks',
      async () => {
        const seen = optOutStudyFactory();
        const unseen = optOutStudyFactory();
        await normandy.studies.start({
          recipeId: seen.id,
          name: seen.arguments.name,
          description: seen.arguments.description,
          addonUrl: seen.arguments.addonUrl,
        });
        await normandy.studies.start({
          recipeId: unseen.id,
          name: unseen.arguments.name,
          description: unseen.arguments.description,
          addonUrl: unseen.arguments.addonUrl,
        });
        spyOn(normandy.studies, 'stop').and.callThrough();

        const action = new OptOutStudyAction(normandy, seen);
        await action.execute();
        await postExecutionHook(normandy);

        expect(normandy.studies.stop).not.toHaveBeenCalledWith(seen.id);
        expect(normandy.studies.stop).toHaveBeenCalledWith(unseen.id);
      },
    );
  });
});
