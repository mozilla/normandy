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
XPCOMUtils.defineLazyModuleGetter(this, "ajv", "resource://shield-recipe-client/vendor/ajv.js");

this.EXPORTED_SYMBOLS = ["StudyStorage"];

const DB_NAME = "shield-studies";
const DB_OPTIONS = {
  version: 1,
  storage: "persistent",
};
const DB_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    addonId: {
      type: "string",
      minLength: 1,
    },
    addonVersion: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: "string",
      minLength: 1,
    },
    studyStartDate: {
      type: "string",
      minLength: 1,
      format: "date-time",
    },
    studyEndDate: {
      type: ["string", "null"],
      minLength: 1,
      format: "date-time",
      default: null,
    },
    active: {
      type: "boolean",
      default: true,
    },
  },
};
const CREATE_SCHEMA = Object.assign({}, DB_SCHEMA, {
  required: [
    "name",
    "addonId",
    "addonVersion",
    "description",
    "studyStartDate",
  ],
});
const UPDATE_SCHEMA = DB_SCHEMA;

const ajvInstance = new ajv({
  allErrors: true,
  useDefaults: true,
});
const validateCreate = ajvInstance.compile(CREATE_SCHEMA);
const validateUpdate = ajvInstance.compile(UPDATE_SCHEMA);

/**
 * Cache the database connection so that it is shared among multiple operations.
 */
let databasePromise;
async function getDatabase() {
  if (!databasePromise) {
    databasePromise = IndexedDB.open(DB_NAME, DB_OPTIONS, db => {
      db.createObjectStore(DB_NAME, {
        keyPath: "name",
      });
    });
  }
  return databasePromise;
}

/**
 * Get a transaction for interacting with the study store.
 *
 * NOTE: Methods on the store returned by this function MUST be called
 * synchronously, otherwise the transaction with the store will expire.
 * This is why the helper takes a database as an argument; if we fetched the
 * database in the helper directly, the helper would be async and the
 * transaction would expire before methods on the store were called.
 */
function getStore(db) {
  return db.objectStore(DB_NAME, "readwrite");
}

this.StudyStorage = {
  async clear() {
    const db = await getDatabase();
    await getStore(db).clear();
  },

  async close() {
    if (databasePromise) {
      const promise = databasePromise;
      databasePromise = null;
      const db = await promise;
      await db.close();
    }
  },

  async has(studyName) {
    const db = await getDatabase();
    const study = await getStore(db).get(studyName);
    return !!study;
  },

  async get(studyName) {
    const db = await getDatabase();
    const study = await getStore(db).get(studyName);
    if (!study) {
      throw new Error(`Could not find a study named ${studyName}.`);
    }

    return study;
  },

  async getAll() {
    const db = await getDatabase();
    return getStore(db).getAll();
  },

  async create(study) {
    if (!validateCreate(study)) {
      throw new Error(
        `Cannot create study: validation failed: ${ajvInstance.errorsText(validateCreate.errors)}`,
      );
    }

    const db = await getDatabase();
    if (await getStore(db).get(study.name)) {
      throw new Error(
        `Cannot create study with name ${study.name}: a study exists with that name already.`,
      );
    }

    return getStore(db).add(study);
  },

  async update(studyName, data) {
    const db = await getDatabase();
    const savedStudy = await getStore(db).get(studyName);
    if (!savedStudy) {
      throw new Error(`Cannot update study ${studyName}: could not find study.`);
    }

    if (!validateUpdate(data)) {
      throw new Error(`
        Cannot update study ${studyName}: validation failed:
        ${ajvInstance.errorsText(validateUpdate.errors)}
      `);
    }

    return getStore(db).put(Object.assign({}, savedStudy, data));
  },
};
