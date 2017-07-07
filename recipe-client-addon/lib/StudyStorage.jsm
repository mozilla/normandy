/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @typedef {Object} Study
 * @property {string} name
 *   Unique name of the study
 * @property {string} version
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

const DB_NAME = "shield-studies";
let gDatabase;

const DB_OPTIONS = {
  namespace: "shield-study-addons",
  version: 1,
  storage: "persistent",
  schema: {
    name: { type: "string", unique: true },
    version: { type: "string" },
    description: { type: "string" },
    studyStartDate: { type: "number" },
    studyEndDate: { type: "number" },
    addonId: { type: "string", },
    active: { type: "boolean" },
  },
};

// Compares a given `data` object against the DB_OPTIONS.schema. Throws if a key
// that is not in the schema appears, or if the schema `type` does not match the
// given value type.
function validateSchema(data) {
  const {schema} = DB_OPTIONS;

  Object.keys(data).forEach((dataKey) => {
    const incomingData = data[dataKey];
    const requiredType = schema[dataKey] && schema[dataKey].type;

    if (!requiredType) {
      throw new Error(`Key "${dataKey}" does not exist in Study schema.`);
    }

    // In some cases, the value will be empty, at which point we just want to
    // skip the rest of validation.
    if (typeof incomingData === "undefined" || incomingData === null) {
      return;
    }

    // If the `type` is a function, it's going to be a class (like Map or Set),
    // otherwise we can assume it is a primitive type (like "boolean" or "number").
    const validates = typeof requiredType === "function" ?
      incomingData instanceof requiredType : typeof incomingData === requiredType;

    if (!validates) {
      throw new Error(`Key "${dataKey}" must be of type "${requiredType.name || requiredType}"`);
    }
  });
}


// Creates new object store and populates that store's indexes.
function setupDatabase(db) {
  const {schema} = DB_OPTIONS;
  const store = db.createObjectStore(DB_NAME, { keyPath: "name" });

  Object.keys(schema).forEach((schemaKey) => {
    store.createIndex(schemaKey, schemaKey, schema[schemaKey]);
  });
}

// Determines if a DB connection/request already exists.
function hasDatabaseRequest() {
  return !!gDatabase;
}

// Returns the currently active IDB connection, and creates one if not
// already present.
async function getDatabase() {
  if (!hasDatabaseRequest()) {
    // gDB is a Promise to prevent multiple calls to `IDB.open` - subsequent calls
    // will refer to this same promise, requiring only one `open` call internally.
    gDatabase = new Promise(async (resolve) => {
      const db = await IndexedDB.open(DB_NAME, DB_OPTIONS, setupDatabase);
      resolve(db);
    });
  }

  return gDatabase;
}


this.StudyStorage = {
  /**
   * Clears all data from the connected IndexedDB.
   * @async
   */
  async clearAllData() {
    const db = await getDatabase();
    await db.objectStore(DB_NAME, "readwrite").clear();
  },

  /**
   * If a database exists and is connected, disconnect and remove the reference
   * to that database.
   *
   * @async
   */
  async closeConnection() {
    if (hasDatabaseRequest()) {
      const db = await getDatabase();
      await db.close();
      gDatabase = null;
    }
  },

  /**
   * Look up a Study based on the given unique name. Returns `null` if no study
   * is found in the DB.
   *
   * @async
   * @param  {string} studyName Unique name of study to retrieve.
   * @return {Promise<Study>}
   */
  async getStudy(studyName) {
    const db = await getDatabase();

    const foundStudy = await db.objectStore(DB_NAME, "readonly").get(studyName);

    return foundStudy || null;
  },

  /**
   * Given a Study, validates its schema and saves the data into the DB's
   * objectStore instance.
   *
   * @async
   * @param  {Study}  study [description]
   * @return {Promise}
   */
  async saveStudy(study) {
    const {
      addonId, // The add-on ID
      name, // The unique name for the study
      version, // The add-on version
      description, // The add-on description
      studyStartDate = Date.now(), // The study start date
      studyEndDate = null, // The study end date (starts off null)
      active = true, // The active status of the study (starts off true)
    } = study;

    const db = await getDatabase();
    const newStudy = {
      name,
      version,
      description,
      studyStartDate,
      studyEndDate,
      addonId,
      active,
    };

    validateSchema(newStudy);

    return db.objectStore(DB_NAME, "readwrite").add(newStudy);
  },

  /**
   * Given a study name and an object of partial Study data, updates that
   * study's values in-place and saves the changes back to the DB.
   *
   * @async
   * @param  {string} studyName Unique name of the study to update.
   * @param  {Study}  data      Object of data to update the study with.
   */
  async updateStudy(studyName, data) {
    if (!studyName) {
      throw new Error("StudyStorage - name is required to update study.");
    }

    const savedStudy = await this.getStudy(studyName);
    if (!savedStudy) {
      throw new Error(`StudyStorage - no study named "${studyName}" exists yet.`);
    }

    validateSchema(data);

    const db = await getDatabase();
    return db.objectStore(DB_NAME, "readwrite").put(Object.assign({}, savedStudy, data));
  },
};
