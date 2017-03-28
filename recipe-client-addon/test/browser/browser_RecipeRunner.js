"use strict";

Cu.import("resource://shield-recipe-client/lib/RecipeRunner.jsm", this);
Cu.import("resource://shield-recipe-client/lib/ClientEnvironment.jsm", this);

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
  const recipe = {filter_expression: "1+1==2"};
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

  Assert.deepEqual(
    context.normandy.recipe,
    recipe,
    "normandy.recipe is the recipe passed to getFilterContext",
  );
});

add_task(async function checkFilter() {
  const check = filter => RecipeRunner.checkFilter({filter_expression: filter});

  // Errors must result in a false return value.
  ok(!(await check("invalid ( + 5yntax")), "Invalid filter expressions return false");

  // Non-boolean filter results result in a true return value.
  ok(await check("[1, 2, 3]"), "Non-boolean filter expressions return true");

  // The given recipe must be available to the filter context.
  const recipe = {filter_expression: "normandy.recipe.seven == 7", seven: 7};
  ok(await RecipeRunner.checkFilter(recipe), "The recipe is available in the filter context");
  recipe.seven = 4;
  ok(!(await RecipeRunner.checkFilter(recipe)), "The recipe is available in the filter context");
});

add_task(async function testStart() {
  const getStub = sinon.stub(ClientEnvironment, "getClientClassification")
    .returns(Promise.resolve(false));

  // When the experiment pref is false, eagerly call getClientClassification.
  await SpecialPowers.pushPrefEnv({set: [
    ["extensions.shield-recipe-client.experiments.lazy_classify", false],
  ]});
  ok(!getStub.called, "getClientClassification hasn't been called");
  await RecipeRunner.start();
  ok(getStub.called, "getClientClassfication was called eagerly");

  // When the experiment pref is true, do not eagerly call getClientClassification.
  await SpecialPowers.pushPrefEnv({set: [
    ["extensions.shield-recipe-client.experiments.lazy_classify", true],
  ]});
  getStub.reset();
  ok(!getStub.called, "getClientClassification hasn't been called");
  await RecipeRunner.start();
  ok(!getStub.called, "getClientClassfication was not called eagerly");

  getStub.restore();
});
