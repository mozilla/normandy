import { mockNormandy } from './utils';
import ShieldStudyAction from '../shield-study/';


describe('ShieldStudyAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = mockNormandy();
  });

  it('should log a message to the console', async () => {
    const action = new ShieldStudyAction(normandy, { arguments: { studyName: 'lorem ipsum' } });
    await action.execute();
    expect(normandy.showStudyConsentPage).toHaveBeenCalledWith({ studyName: 'lorem ipsum' });
  });

  it('should not run if it has already been shown', async () => {
    const action = new ShieldStudyAction(normandy, { arguments: { studyName: 'lorem ipsum' } });

    normandy.mock.storage.data.studyHasBeenShown = true;

    await action.execute();
    expect(normandy.showStudyConsentPage).not.toHaveBeenCalled();
  });

  it('should not run if localStorage is unavailable', async () => {
    const action = new ShieldStudyAction(normandy, { arguments: { studyName: 'lorem ipsum' } });

    normandy.testing = true;
    spyOn(normandy, 'createStorage').and.returnValue(Promise.reject('err'));

    expect(await action.execute()).toThrowError('err');
  });

  it('should always run in testing mode', async () => {
    const action = new ShieldStudyAction(normandy, { arguments: { studyName: 'lorem ipsum' } });

    normandy.testing = true;
    normandy.mock.storage.data.studyHasBeenShown = true;
    await action.execute();
    expect(normandy.showStudyConsentPage).toHaveBeenCalled();
  });
});
