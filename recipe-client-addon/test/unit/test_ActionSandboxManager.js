"use strict";

Cu.import("resource://shield-recipe-client/lib/ActionSandboxManager.jsm");

async function withManager(testFunction) {
  const manager = new ActionSandboxManager();
  manager.addHold("testing");
  await testFunction(manager);
  manager.removeHold("testing");
}

add_task(withManager(async function testMissingCallbackName(manager) {
  equal(
    await manager.runAsyncCallbackFromScript("1 + 1", "missingCallback"),
    undefined,
    "runAsyncCallbackFromScript returns undefined when given a missing callback name",
  );
}));

add_task(withManager(async function testCallback(manager) {
  const result = await manager.runAsyncCallbackFromScript(`
    registerAsyncCallback("testCallback", async function(normandy) {
      return 5;
    });
  `, "testCallback");
  equal(result, 5, "runAsyncCallbackFromScript executes the named callback inside the sandbox");
}));

add_task(withManager(async function testArguments(manager) {
  const result = await manager.runAsyncCallbackFromScript(`
    registerAsyncCallback("testCallback", async function(normandy, a, b) {
      return a + b;
    });
  `, "testCallback", 4, 6);
  equal(result, 10, "runAsyncCallbackFromScript passes arguments to the callback");
}));

add_task(withManager(async function testCloning(manager) {
  const result = await manager.runAsyncCallbackFromScript(`
    registerAsyncCallback("testCallback", async function(normandy, obj) {
      return {foo: "bar", baz: obj.baz};
    });
  `, "testCallback", {baz: "biff"});

  deepEqual(
    result,
    {foo: "bar", baz: "biff"},
    (
      "runAsyncCallbackFromScript clones arguments into the sandbox and return values into the " +
      "context it was called from"
    ),
  );
}));

add_task(withManager(async function testError(manager) {
  try {
    await manager.runAsyncCallbackFromScript(`
      registerAsyncCallback("testCallback", async function(normandy) {
        throw new Error("WHY")
      });
    `, "testCallback");
    ok(false, "runAsnycCallbackFromScript throws errors when raised by the sandbox");
  } catch (err) {
    equal(err.message, "WHY", "runAsnycCallbackFromScript clones error messages");
  }
}));

add_task(withManager(async function testDriver(manager) {
  const logInDriver = await manager.runAsyncCallbackFromScript(`
    registerAsyncCallback("testCallback", async function(normandy) {
      return "log" in normandy;
    });
  `, "testCallback");
  ok(logInDriver, "runAsyncCallbackFromScript passes a driver as the first parameter");
}));

add_task(withManager(async function testGlobalObject(manager) {
  // Test that window is an alias for the global object, and that it
  // has some expected functions available on it.
  const script = `
    window.setOnWindow = "set";
    this.setOnGlobal = "set";

    registerAsyncCallback("testCallback", async function(normandy) {
      return {
        setOnWindow: setOnWindow,
        setOnGlobal: window.setOnGlobal,
        setTimeoutExists: setTimeout !== undefined,
        clearTimeoutExists: clearTimeout !== undefined,
      };
    });
  `;

  const result = await manager.runAsyncCallbackFromScript(script, "testCallback");
  Assert.deepEqual(result, {
    setOnWindow: "set",
    setOnGlobal: "set",
    setTimeoutExists: true,
    clearTimeoutExists: true,
  }, "sandbox.window is the global object and has expected functions.");
}));

add_task(withManager(async function testRegisterActionShim(manager) {
  const recipe = {
    foo: "bar",
  };
  const actionScript = `
    class TestAction {
      constructor(driver, recipe) {
        this.driver = driver;
        this.recipe = recipe;
      }

      execute() {
        return new Promise(resolve => {
          resolve({
            foo: this.recipe.foo,
            isDriver: "log" in this.driver,
          });
        });
      }
    }

    registerAction('test-action', TestAction);
  `;

  const result = await manager.runAsyncCallbackFromScript(actionScript, "action", recipe);
  equal(result.foo, "bar", "registerAction registers an async callback for actions");
  equal(result.isDriver, true, "registerAction passes the driver to the action class constructor");
}));
