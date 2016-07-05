import { mockNormandy } from './utils';
import ConsoleLogAction from '../../static/actions/console-log/index';


describe('ConsoleLogAction', function () {
  beforeEach(function () {
    this.normandy = mockNormandy();
  });

  it('should log a message to the console', async function() {
    let action = new ConsoleLogAction(this.normandy, { arguments: { message: 'test message' } });
    await action.execute();
    expect(this.normandy.log).toHaveBeenCalledWith('test message', 'info');
  });
});
