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
    const { context, message, reason } = handleError('Test.', { field: 'Validation message.' });
    expect(context).toBe('Test.');
    expect(message).toBe(`Test. ${ERR_MESSAGES.FORM_VALIDATION}`);
    expect(reason).toBe(ERR_MESSAGES.FORM_VALIDATION);
  });

  describe('API Errors', () => {
    it('should handle 400 errors', () => {
      const err = new APIClient.APIError('Something from the server.', { status: 400 });

      const { context, message, reason } = handleError('Test.', err);
      expect(context).toBe('Test.');
      expect(message).toBe(`Test. ${ERR_MESSAGES.FORM_VALIDATION}`);
      expect(reason).toBe(ERR_MESSAGES.FORM_VALIDATION);
    });

    describe('should handle 403 errors', () => {
      it('should handle a "not logged in" 403 error', () => {
        const err = new APIClient.APIError('Authentication credentials were not provided',
          { status: 403 });

        const { context, message, reason } = handleError('Test.', err);
        expect(context).toBe('Test.');
        expect(message).toBe(`Test. ${ERR_MESSAGES.NOT_LOGGED_IN}`);
        expect(reason).toBe(ERR_MESSAGES.NOT_LOGGED_IN);
      });

      it('should handle a "no permission" 403 error', () => {
        const err = new APIClient.APIError('User does not have permission to perform that action.',
          { status: 403 });

        const { context, message, reason } = handleError('Test.', err);
        expect(context).toBe('Test.');
        expect(message).toBe(`Test. ${ERR_MESSAGES.NO_PERMISSION}`);
        expect(reason).toBe(ERR_MESSAGES.NO_PERMISSION);
      });
    });

    it('should handle 500 errors', () => {
      const err = new APIClient.APIError('Something from the server.', { status: 500 });

      const { context, message, reason } = handleError('Test.', err);
      expect(context).toBe('Test.');
      expect(message).toBe(`Test. ${ERR_MESSAGES.SERVER_FAILED} (Something from the server.)`);
      expect(reason).toBe(`${ERR_MESSAGES.SERVER_FAILED} (Something from the server.)`);
    });

    it('should fall back to server messages if the response status is unrecognized', () => {
      const err = new APIClient.APIError('Something from the server.', { status: 123 });

      const { context, message, reason } = handleError('Test.', err);
      expect(context).toBe('Test.');
      expect(message).toBe('Test. Something from the server.');
      expect(reason).toBe('Something from the server.');
    });
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
