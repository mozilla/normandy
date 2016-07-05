import { mockNormandy } from './utils';
import ConsoleLogAction from '../../static/actions/console-log/index';


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
