import { mockNormandy } from './utils';
import ConsoleLogAction from '../console-log';


describe('ConsoleLogAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = mockNormandy();
  });

  it('should log a message to the console', async () => {
    const action = new ConsoleLogAction(normandy, { arguments: { message: 'test message' } });
    await action.execute();
    expect(normandy.log).toHaveBeenCalledWith('test message', 'info');
  });
});
