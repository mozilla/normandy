"use strict";

Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://shield-recipe-client/lib/RecipeRunner.jsm", this);
Cu.import("resource://shield-recipe-client/lib/ClientEnvironment.jsm", this);
Cu.import("resource://shield-recipe-client/lib/CleanupManager.jsm", this);

add_task(async function execute() {
  // Test that RecipeRunner can execute a basic recipe/action and return
  // the result of execute.
  const recipe = {
    foo: "bar",
  };
  const actionScript = `
    class TestAction {
      constructor(driver, recipe) {
        this.recipe = recipe;
      }

      execute() {
        return new Promise(resolve => {
          resolve({foo: this.recipe.foo});
        });
      }
    }

    registerAction('test-action', TestAction);
  `;

  const result = await RecipeRunner.executeAction(recipe, actionScript);
  is(result.foo, "bar", "Recipe executed correctly");
});

add_task(async function error() {
  // Test that RecipeRunner rejects with error messages from within the
  // sandbox.
  const actionScript = `
    class TestAction {
      execute() {
        return new Promise((resolve, reject) => {
          reject(new Error("ERROR MESSAGE"));
        });
      }
    }

    registerAction('test-action', TestAction);
  `;

  let gotException = false;
  try {
    await RecipeRunner.executeAction({}, actionScript);
  } catch (err) {
    gotException = true;
    is(err.message, "ERROR MESSAGE", "RecipeRunner throws errors from the sandbox correctly.");
  }
  ok(gotException, "RecipeRunner threw an error from the sandbox.");
});

add_task(async function globalObject() {
  // Test that window is an alias for the global object, and that it
  // has some expected functions available on it.
  const actionScript = `
    window.setOnWindow = "set";
    this.setOnGlobal = "set";

    class TestAction {
      execute() {
        return new Promise(resolve => {
          resolve({
            setOnWindow: setOnWindow,
            setOnGlobal: window.setOnGlobal,
            setTimeoutExists: setTimeout !== undefined,
            clearTimeoutExists: clearTimeout !== undefined,
          });
        });
      }
    }

    registerAction('test-action', TestAction);
  `;

  const result = await RecipeRunner.executeAction({}, actionScript);
  Assert.deepEqual(result, {
    setOnWindow: "set",
    setOnGlobal: "set",
    setTimeoutExists: true,
    clearTimeoutExists: true,
  }, "sandbox.window is the global object and has expected functions.");
});

add_task(async function getFilterContext() {
  const recipe = {id: 17, arguments: {foo: "bar"}, unrelated: false};
  const context = RecipeRunner.getFilterContext(recipe);

  // Test for expected properties in the filter expression context.
  const expectedNormandyKeys = [
    "channel",
    "country",
    "distribution",
    "doNotTrack",
    "isDefaultBrowser",
    "locale",
    "plugins",
    "recipe",
    "request_time",
    "searchEngine",
    "syncDesktopDevices",
    "syncMobileDevices",
    "syncSetup",
    "syncTotalDevices",
    "telemetry",
    "userId",
    "version",
  ];
  for (const key of expectedNormandyKeys) {
    ok(key in context.normandy, `normandy.${key} is available`);
  }

  is(
    context.normandy.recipe.id,
    recipe.id,
    "normandy.recipe is the recipe passed to getFilterContext",
  );
  delete recipe.unrelated;
  Assert.deepEqual(
    context.normandy.recipe,
    recipe,
    "normandy.recipe drops unrecognized attributes from the recipe",
  );
});

add_task(async function checkFilter() {
  const check = filter => RecipeRunner.checkFilter({filter_expression: filter});

  // Errors must result in a false return value.
  ok(!(await check("invalid ( + 5yntax")), "Invalid filter expressions return false");

  // Non-boolean filter results result in a true return value.
  ok(await check("[1, 2, 3]"), "Non-boolean filter expressions return true");

  // The given recipe must be available to the filter context.
  const recipe = {filter_expression: "normandy.recipe.id == 7", id: 7};
  ok(await RecipeRunner.checkFilter(recipe), "The recipe is available in the filter context");
  recipe.id = 4;
  ok(!(await RecipeRunner.checkFilter(recipe)), "The recipe is available in the filter context");
});

add_task(async function testClientClassificationCache() {
  const getStub = sinon.stub(ClientEnvironment, "getClientClassification")
    .returns(Promise.resolve(false));

  await SpecialPowers.pushPrefEnv({set: [
    ["extensions.shield-recipe-client.api_url",
     "https://example.com/selfsupport-dummy"],
  ]});

  // When the experiment pref is false, eagerly call getClientClassification.
  await SpecialPowers.pushPrefEnv({set: [
    ["extensions.shield-recipe-client.experiments.lazy_classify", false],
  ]});
  ok(!getStub.called, "getClientClassification hasn't been called");
  await RecipeRunner.run();
  ok(getStub.called, "getClientClassification was called eagerly");

  // When the experiment pref is true, do not eagerly call getClientClassification.
  await SpecialPowers.pushPrefEnv({set: [
    ["extensions.shield-recipe-client.experiments.lazy_classify", true],
  ]});
  getStub.reset();
  ok(!getStub.called, "getClientClassification hasn't been called");
  await RecipeRunner.run();
  ok(!getStub.called, "getClientClassification was not called eagerly");

  getStub.restore();
});

add_task(async function testStartup() {
  const runStub = sinon.stub(RecipeRunner, "run");
  const addCleanupHandlerStub = sinon.stub(CleanupManager, "addCleanupHandler");
  const updateRunIntervalStub = sinon.stub(RecipeRunner, "updateRunInterval");

  // in dev mode
  await SpecialPowers.pushPrefEnv({set: [["extensions.shield-recipe-client.dev_mode", true]]});
  RecipeRunner.init();
  ok(runStub.called, "RecipeRunner.run is called immediately when in dev mode");
  ok(addCleanupHandlerStub.called, "A cleanup function is registered when in dev mode");
  ok(updateRunIntervalStub.called, "A timer is registered when in dev mode");

  runStub.reset();
  addCleanupHandlerStub.reset();
  updateRunIntervalStub.reset();

  // not in dev mode
  await SpecialPowers.pushPrefEnv({set: [["extensions.shield-recipe-client.dev_mode", false]]});
  RecipeRunner.init();
  ok(!runStub.called, "RecipeRunner.run is not called immediately when not in dev mode");
  ok(addCleanupHandlerStub.called, "A cleanup function is registered when not in dev mode");
  ok(updateRunIntervalStub.called, "A timer is registered when not in dev mode");

  runStub.restore();
  addCleanupHandlerStub.restore();
  updateRunIntervalStub.restore();
});
