"use strict";

Cu.import("resource://shield-recipe-client/lib/ShieldRecipeClient.jsm", this);
Cu.import("resource://shield-recipe-client/lib/RecipeRunner.jsm", this);
Cu.import("resource://shield-recipe-client/lib/PreferenceExperiments.jsm", this);
Cu.import("resource://shield-recipe-client-content/AboutPages.jsm", this);

add_task(async function testStartup() {
  sinon.stub(RecipeRunner, "init");
  sinon.stub(PreferenceExperiments, "init");
  sinon.stub(AboutPages, "init");

  await ShieldRecipeClient.startup();
  ok(AboutPages.init.called, "startup calls AboutPages.init");
  ok(PreferenceExperiments.init.called, "startup calls PreferenceExperiments.init");
  ok(RecipeRunner.init.called, "startup calls RecipeRunner.init");

  PreferenceExperiments.init.restore();
  RecipeRunner.init.restore();
  AboutPages.init.restore();
});

add_task(async function testStartupPrefInitFail() {
  sinon.stub(RecipeRunner, "init");
  sinon.stub(PreferenceExperiments, "init").returns(Promise.reject(new Error("oh no")));
  sinon.stub(AboutPages, "init");

  await ShieldRecipeClient.startup();
  ok(PreferenceExperiments.init.called, "startup calls PreferenceExperiments.init");
  // Even if PreferenceExperiments.init fails, other init functions should be called.
  ok(AboutPages.init.called, "startup calls AboutPages.init");
  ok(RecipeRunner.init.called, "startup calls RecipeRunner.init");

  PreferenceExperiments.init.restore();
  RecipeRunner.init.restore();
  AboutPages.init.restore();
});

add_task(async function testStartupAboutPagesInitFail() {
  sinon.stub(RecipeRunner, "init");
  sinon.stub(PreferenceExperiments, "init");
  sinon.stub(AboutPages, "init").returns(Promise.reject(new Error("oh no")));

  await ShieldRecipeClient.startup();
  ok(AboutPages.init.called, "startup calls AboutPages.init");
  // Even if PreferenceExperiments.init fails, other init functions should be called.
  ok(PreferenceExperiments.init.called, "startup calls PreferenceExperiments.init");
  ok(RecipeRunner.init.called, "startup calls RecipeRunner.init");

  PreferenceExperiments.init.restore();
  RecipeRunner.init.restore();
  AboutPages.init.restore();
});
