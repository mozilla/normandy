"use strict";

Cu.import("resource://gre/modules/IndexedDB.jsm", this);
Cu.import("resource://shield-recipe-client/lib/StudyStorage.jsm", this);

const REQUIRED_FIELDS = ["name", "addonId", "addonVersion", "description", "studyStartDate"];

function withStudyStorage(testFn) {
  return async () => {
    try {
      await testFn(StudyStorage);
    } finally {
      await StudyStorage.clear();
      await StudyStorage.close();
    }
  };
}

function studyFactory(attrs) {
  return Object.assign({
    name: "Test study",
    addonId: "foo@example.com",
    addonVersion: "2.0.0",
    description: "fake",
    studyStartDate: new Date().toJSON(),
  }, attrs);
}

add_task(withStudyStorage(async function testGetMissing(storage) {
  await Assert.rejects(
    storage.get("does-not-exist"),
    /Could not find/,
    "get rejects when the requested study is not stored",
  );
}));

add_task(withStudyStorage(async function testCreateGet(storage) {
  const study = studyFactory({name: "test-study"});
  await storage.create(study);

  const storedStudy = await storage.get("test-study");
  Assert.deepEqual(study, storedStudy, "Create saved a new study to the storage.");
  is(storedStudy.studyEndDate, null, "Create defaults the study end date to null.");
  ok(storedStudy.active, "Create defaults the study to active.");
}));

add_task(withStudyStorage(async function testCreateExists(storage) {
  const study = studyFactory({name: "test-study"});
  await storage.create(study);

  const dupeStudy = studyFactory({name: "test-study"});
  Assert.rejects(
    storage.create(dupeStudy),
    /test-study/,
    "create throws when a study exists with the given name already",
  );
}));

add_task(withStudyStorage(async function testCreateSchema(storage) {
  for (const requiredField of REQUIRED_FIELDS) {
    let study = studyFactory({ [requiredField]: undefined });
    let msg = `create threw an error due to missing required field ${requiredField}`;
    await Assert.rejects(storage.create(study), new RegExp(requiredField), msg);

    // Blank values are not allowed for required fields either
    study = studyFactory({ [requiredField]: "" });
    msg = `create threw an error due to blank required field ${requiredField}`;
    await Assert.rejects(storage.create(study), new RegExp(requiredField), msg);
  }

  let study = studyFactory({studyStartDate: "invalid-datetime"});
  await Assert.rejects(
    storage.create(study),
    /studyStartDate/,
    "create rejected due to an invalid start date",
  );

  study = studyFactory({studyEndDate: "invalid-datetime"});
  await Assert.rejects(
    storage.create(study),
    /studyEndDate/,
    "create rejected due to an invalid end date",
  );

  study = studyFactory({active: "not a boolean"});
  await Assert.rejects(
    storage.create(study),
    /active/,
    "create rejected due to an invalid active status",
  );
}));

add_task(withStudyStorage(async function testCreateHas(storage) {
  let hasStudy = await storage.has("test-study");
  ok(!hasStudy, "has returns false before the study has been created.");

  const study = studyFactory({name: "test-study"});
  await storage.create(study);

  hasStudy = await storage.has("test-study");
  ok(hasStudy, "has returns true after the study has been created");
}));

add_task(withStudyStorage(async function testCreateUpdate(storage) {
  const study = studyFactory({name: "test-study", addonVersion: "1.0", addonId: "foo@example.com"});
  await storage.create(study);
  await storage.update("test-study", {addonVersion: "2.0"});

  const storedStudy = await storage.get("test-study");
  is(storedStudy.addonVersion, "2.0", "update modified the stored study.");
  is(storedStudy.addonId, "foo@example.com", "update did not modify unspecified fields");
}));

add_task(withStudyStorage(async function testUpdateSchema(storage) {
  const study = studyFactory({name: "test-study"});
  await storage.create(study);

  // Required fields must not be blank if they're specified
  for (const requiredField of REQUIRED_FIELDS) {
    const msg = `update threw an error due to blank required field ${requiredField}`;
    await Assert.rejects(
      storage.update("test-study", { [requiredField]: "" }),
      new RegExp(requiredField),
      msg,
    );
  }

  await Assert.rejects(
    storage.update("test-study", {studyStartDate: "invalid-datetime"}),
    /studyStartDate/,
    "update rejected due to an invalid start date",
  );

  await Assert.rejects(
    storage.update("test-study", {studyEndDate: "invalid-datetime"}),
    /studyEndDate/,
    "update rejected due to an invalid end date",
  );

  await Assert.rejects(
    storage.update("test-study", {active: "not a boolean"}),
    /active/,
    "update rejected due to an invalid active status",
  );
}));

add_task(withStudyStorage(async function testUpdateMissing(storage) {
  await Assert.rejects(
    storage.update("does-not-exist", {addonVersion: "2.0"}),
    /could not find/,
    "update rejects when the requested study is not stored",
  );
}));

add_task(withStudyStorage(async function testUpdateMissing(storage) {
  await Assert.rejects(
    storage.update("does-not-exist", {addonVersion: "2.0"}),
    /could not find/,
    "update rejects when the requested study is not stored",
  );
}));

add_task(withStudyStorage(async function testCloseDatabase(storage) {
  const openSpy = sinon.spy(IndexedDB, "open");
  sinon.assert.notCalled(openSpy);

  // Using storage at all should open the database, but only once.
  await storage.has("foo");
  await storage.create(studyFactory({name: "test-study"}));
  sinon.assert.calledOnce(openSpy);

  // close can be called multiple times
  await storage.close();
  await storage.close();

  // After being closed, new operations cause the database to be opened again
  await storage.has("test-study");
  sinon.assert.calledTwice(openSpy);

  openSpy.restore();
}));

add_task(withStudyStorage(async function testClear(storage) {
  await storage.create(studyFactory({name: "test-study1"}));
  await storage.create(studyFactory({name: "test-study2"}));
  const hasAll = (await storage.has("test-study1")) && (await storage.has("test-study2"));
  ok(hasAll, "Before calling clear, both studies are in the storage.");

  await storage.clear();
  const hasAny = (await storage.has("test-study1")) || (await storage.has("test-study2"));
  ok(!hasAny, "After calling clear, all studies are removed from storage.");
}));
