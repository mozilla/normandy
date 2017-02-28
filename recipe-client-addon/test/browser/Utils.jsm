const {utils: Cu} = Components;
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm", this);
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm", this);

this.EXPORTED_SYMBOLS = ["Utils"];

this.Utils = {
  UUID_REGEX: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,

  withSandboxManager(Assert, testGenerator) {
    return function* inner() {
      const sandboxManager = new SandboxManager();
      sandboxManager.addHold("test running");

      yield testGenerator(sandboxManager);

      sandboxManager.removeHold("test running");
      yield sandboxManager.isNuked()
        .then(() => Assert.ok(true, "sandbox is nuked"))
        .catch(e => Assert.ok(false, "sandbox is nuked", e));
    };
  },

  withDriver(Assert, testGenerator) {
    return Utils.withSandboxManager(Assert, function* inner(sandboxManager) {
      const driver = new NormandyDriver(sandboxManager);
      yield testGenerator(driver);
    });
  },

  /**
   * Test wrapper that replaces a property on an object with another value for
   * the duration of the test. The test generator is passed the replaced value.
   */
  withPatch(object, propertyName, patchValue, testGenerator) {
    return function* inner() {
      const original = object[propertyName];
      object[propertyName] = patchValue;
      yield testGenerator(patchValue);
      object[propertyName] = original;
    };
  },

  /**
   * Creates a wrapper function that tracks whether it has been called.
   */
  createMock(wrapped) {
    const mock = function(...args) {
      mock.called = true;
      if ("returnValue" in mock) {
        return mock.returnValue;
      }
      return wrapped(...args);
    };
    mock.called = false;
    mock.reset = function() {
      mock.called = false;
    };

    return mock;
  },

  /**
   * Test wrapper that wraps a function on an object with a mock value.
   */
  withMock(object, propertyName, testGenerator) {
    return this.withPatch(
      object,
      propertyName,
      this.createMock(object[propertyName]),
      testGenerator
    );
  },
};
