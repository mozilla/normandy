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
});
