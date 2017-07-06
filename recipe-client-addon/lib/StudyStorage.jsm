/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @typedef {Object} Study
 * @property {string} name
 *   Unique name of the study
 * @property {number} version
 *   Study add-on version number
 * @property {string} description
 *   Description of the study and its intent.
 * @property {string} studyStartDate
 *   ISO-formatted date string of when the study was started.
 * @property {string} studyEndDate
 *   ISO-formatted date string of when the study was ended.
 * @property {string} addonId
 *   Add-on ID for this particular study.
 * @property {boolean} active
 *   Is the study still running?
 */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.EXPORTED_SYMBOLS = ["StudyStorage"];

const DB_OPTIONS = {
  namespace: "shield-study-addons",
  version: 1,
  storage: "persistent",
  schema: {
    name: { autoIncrement: false, unique: true },
    version: { autoIncrement: false, unique: false },
    description: { autoIncrement: false, unique: false },
    studyStartDate: { autoIncrement: false, unique: false },
    studyEndDate: { autoIncrement: false, unique: false },
    addonId: { autoIncrement: false, unique: false },
    active: { autoIncrement: false, unique: false },
  },
};

const dbName = "shield-studies";
let database;

async function getDatabase() {
  if (!database) {
    database = await IndexedDB.open(dbName, DB_OPTIONS, db => {
      db.createObjectStore(dbName, { keyPath: "name" });
    });
  }
  return database;
}

this.StudyStorage = {
  async clearAllData() {
    if (database) {
      await database.objectStore(dbName, "readwrite").clear();
    }
  },

  async closeConnection() {
    if (database) {
      await database.close();
      database = null;
    }
  },

  async getStudy(studyName) {
    const db = await getDatabase();

    return db.objectStore(dbName, "readonly").get(studyName);
  },

  async saveStudy(study) {
    const {
      name, // The unique name for the study
      version, // The add-on version
      description, // The add-on description
      studyStartDate = Date.now(), // The study start date
      studyEndDate = null, // The study end date (starts off null)
      addonId = study.id, // The add-on ID
      active = true, // The active status of the study (starts off true)
    } = study;

    const db = await getDatabase();

    return db.objectStore(dbName, "readwrite")
      .add({
        name,
        version,
        description,
        studyStartDate,
        studyEndDate,
        addonId,
        active,
      });
  },

  async updateStudy(study) {
    const db = await getDatabase();

    return db.objectStore(dbName, "readwrite").put(study);
  },
};
