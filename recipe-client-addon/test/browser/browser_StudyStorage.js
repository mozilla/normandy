"use strict";

Cu.import("resource://shield-recipe-client/lib/StudyStorage.jsm", this);

// -------

add_task(async function checkReset() {
  ok(!StudyStorage.database, "StudyStorage starts without an IDB instance.");

  await StudyStorage.getDatabase();
  ok(StudyStorage.database, "StudyStorage creates an IDB instance.");

  await StudyStorage.reset();
  ok(!StudyStorage.database, "StudyStorage correctly removes its IDB instance.");
});

add_task(async function checkGetDatabase() {
  await StudyStorage.reset(true);
  ok(!StudyStorage.database, "StudyStorage starts without an IDB instance.");

  const db1 = await StudyStorage.getDatabase();
  ok(db1, "StudyStorage creates an IDB instance.");

  const db2 = await StudyStorage.getDatabase();
  is(db1, db2, "StudyStorage creates only one IDB instance at a time.");
});


add_task(async function checkSaveStudy() {
  await StudyStorage.reset(true);
  let success = true;

  try {
    await StudyStorage.saveStudyData({
      name: "hi",
      version: 2,
      description: "fake",
      id: 12345
    });
  } catch (err) {
    success = false;
    throw err;
  }

  ok(success, "StudyStorage saved data successfully using `saveStudyData`.");
});

// Test looking up study data
add_task(async function checkGetStudyData() {
  await StudyStorage.reset(true);

  const mockStudy = {
    name: "Test",
    version: 2,
    description: "fake",
    id: "12345"
  };

  await StudyStorage.saveStudyData(mockStudy);

  const study = await StudyStorage.getStudyData("12345");

  is(study.name, mockStudy.name, "StudyStorage loaded name successfully using `getStudyData`.");
  is(study.version, mockStudy.version,
    "StudyStorage loaded version successfully using `getStudyData`.");
});


// Test saving different data with the same `id`
add_task(async function checkOverwriteStudy() {
  await StudyStorage.reset(true);

  await StudyStorage.saveStudyData({
    name: "hey",
    version: 1,
    description: "fake",
    id: "12345"
  });

  await StudyStorage.saveStudyData({
    name: "hello",
    version: 2,
    description: "fake",
    id: "12345"
  });

  let savedStudy = await StudyStorage.getStudyData("12345");

  ok(savedStudy, "saveStudyData correctly saved the study.");
  is(savedStudy.name, "hello", "saveStudyData correctly updated the study name.");
  is(savedStudy.version, 2, "saveStudyData correctly updated the study version");
});
