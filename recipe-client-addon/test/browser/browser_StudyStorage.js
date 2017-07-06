"use strict";

Cu.import("resource://shield-recipe-client/lib/StudyStorage.jsm", this);

function withStudyStorage(testFn) {
  return async () => {
    await testFn(StudyStorage);

    await StudyStorage.clearAllData();
    await StudyStorage.closeConnection();
  };
}

// -------

add_task(withStudyStorage(async function checkSaveStudy(storage) {
  try {
    await storage.saveStudy({
      name: "hi",
      version: 2,
      description: "fake",
      id: 12345
    });
  } catch (err) {
    throw err;
  }
}));

// Test looking up study data
add_task(withStudyStorage(async function checkGetStudy(storage) {
  const mockStudy = {
    name: "Test",
    version: 2,
    description: "fake",
    id: "12345"
  };

  await storage.saveStudy(mockStudy);

  const study = await storage.getStudy("Test");

  is(study.name, mockStudy.name, "StudyStorage loaded name successfully using `getStudyData`.");
  is(study.version, mockStudy.version,
    "StudyStorage loaded version successfully using `getStudyData`.");
}));


// Test saving different data with the same `id`
add_task(withStudyStorage(async function checkUpdateStudy(storage) {

  await storage.saveStudy({
    name: "hey",
    version: 1,
    description: "fake",
    id: "12345"
  });

  await storage.updateStudy({
    name: "hey",
    version: 123,
    description: "test",
    id: "12345"
  });

  const savedStudy = await storage.getStudy("hey");

  ok(savedStudy, "saveStudyData correctly saved the study.");
  is(savedStudy.name, "hey", "saveStudyData correctly updated the study name.");
  is(savedStudy.version, 123, "saveStudyData correctly updated the study version");
}));
