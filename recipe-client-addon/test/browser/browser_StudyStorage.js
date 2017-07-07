"use strict";

Cu.import("resource://shield-recipe-client/lib/StudyStorage.jsm", this);

function withStudyStorage(testFn) {
  return async () => {
    try {
      await testFn(StudyStorage);
    } finally {
      await StudyStorage.clearAllData();
      await StudyStorage.closeConnection();
    }
  };
}

add_task(withStudyStorage(async function checkSaveStudy(storage) {
  await storage.saveStudy({
    name: "Test study",
    version: "2.0.0",
    description: "fake",
    addonId: "12345"
  });
}));

// Test looking up study data
add_task(withStudyStorage(async function checkGetStudy(storage) {
  const mockStudy = {
    name: "Test",
    version: "2.0.0",
    description: "fake",
    addonId: "12345"
  };

  await storage.saveStudy(mockStudy);

  const study = await storage.getStudy("Test");

  is(study.name, mockStudy.name, "StudyStorage loaded name successfully using `getStudyData`.");
  is(study.version, mockStudy.version,
    "StudyStorage loaded version successfully using `getStudyData`.");
}));

// Test looking up nonexistant data
add_task(withStudyStorage(async function checkGetMissingStudy(storage) {
  const study = await storage.getStudy("Test");

  is(study, null, "StudyStorage correctly returned `null` for a missing study.");
}));


// Test saving different data with the same `id`
add_task(withStudyStorage(async function checkUpdateStudy(storage) {

  await storage.saveStudy({
    name: "Test Study",
    version: "1.0.0",
    description: "fake",
    addonId: "12345"
  });

  await storage.updateStudy("Test Study", {
    version: "123.0.0",
    description: "test",
    addonId: "456"
  });

  const savedStudy = await storage.getStudy("Test Study");

  ok(savedStudy, "saveStudyData correctly saved the study.");
  is(savedStudy.name, "Test Study", "saveStudyData correctly updated the study name.");
  is(savedStudy.version, "123.0.0", "saveStudyData correctly updated the study version");
  is(savedStudy.addonId, "456", "saveStudyData correctly updated the study addon ID");
}));

// Test updating with incomplete data
add_task(withStudyStorage(async function checkUpdateIncompleteStudy(storage) {
  const mockStudy = {
    name: "Test Study",
    version: "500.0.0",
    description: "fake",
    addonId: "12345"
  };

  await storage.saveStudy(mockStudy);

  await storage.updateStudy("Test Study", { description: "test" });

  const savedStudy = await storage.getStudy("Test Study");

  ok(savedStudy, "saveStudyData correctly saved the study.");
  is(savedStudy.name, mockStudy.name, "saveStudyData correctly updated the study name.");
  is(savedStudy.version, mockStudy.version, "saveStudyData correctly updated the study version.");
  is(savedStudy.addonId, mockStudy.addonId, "saveStudyData correctly updated the study addonId.");
  is(savedStudy.description, "test", "saveStudyData correctly updated the study description.");
}));


// Test creating with incorrect schema
add_task(withStudyStorage(async function checkCreateInvalidSchema(storage) {
  const mockStudy = {
    name: 12345,
    version: 500,
    description: true,
    addonId: new Map()
  };

  let didThrow = false;
  try {
    await storage.saveStudy(mockStudy);
  } catch (e) {
    didThrow = true;
  }

  ok(didThrow, "Invalid schema correctly threw errors.");
}));
