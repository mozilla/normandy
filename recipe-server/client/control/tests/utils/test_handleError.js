import handleError, { ERR_MESSAGES } from 'control/utils/handleError';
import APIClient from 'control/utils/api';

describe('handleError util', () => {
  it('should work', () => {
    const wrapper = () => handleError();
    expect(wrapper).not.toThrow();
  });

  it('should return the context', () => {
    const { context, message, reason } = handleError('Test error');
    expect(context).toBe('Test error');
    expect(message).toBe('Test error');
    expect(reason).toBe('');
  });

  it('should determine a message based on the error given', () => {
    const { context, message, reason } = handleError('Test.', new Error('Error Message.'));
    expect(context).toBe('Test.');
    expect(message).toBe('Test. Error Message.');
    expect(reason).toBe('Error Message.');
  });

  it('should detect form validation errors', () => {
    const err = new APIClient.APIError('Server Error.', { field: 'Validation message. ' });

    const { context, message, reason } = handleError('Test.', err);
    expect(context).toBe('Test.');
    expect(message).toBe(`Test. ${ERR_MESSAGES.FORM_VALIDATION}`);
    expect(reason).toBe(ERR_MESSAGES.FORM_VALIDATION);
  });

  it('should fall back to server messages if no form validation errors', () => {
    const err = new APIClient.APIError('Something from the server.');

    const { context, message, reason } = handleError('Test.', err);
    expect(context).toBe('Test.');
    expect(message).toBe('Test. Something from the server.');
    expect(reason).toBe('Something from the server.');
  });

  it('should detect when a user is offline', () => {
    const { context, message, reason } = handleError('Test.', new Error(), {
      checkUserOnline: () => false,
    });
    expect(context).toBe('Test.');
    expect(message).toBe(`Test. ${ERR_MESSAGES.NO_INTERNET}`);
    expect(reason).toBe(ERR_MESSAGES.NO_INTERNET);
  });

  it('should notify the user somehow', () => {
    let called = false;
    handleError('Test.', new Error(), {
      notifyUser: () => { called = true; },
    });

    expect(called).toBe(true);
  });
});
