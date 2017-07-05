/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    name: { autoIncrement: false, unique: false },
    version: { autoIncrement: false, unique: false },
    description: { autoIncrement: false, unique: false },
    installDate: { autoIncrement: false, unique: false },
    studyEndDate: { autoIncrement: false, unique: false },
    addonId: { autoIncrement: false, unique: true },
    active: { autoIncrement: false, unique: false },
  },
};

this.StudyStorage = {
  dbName: "shield-studies",

  async reset(clearData) {
    if (this.database) {
      if (clearData) {
        await this.database.objectStore(this.dbName, "readwrite").clear();
      }

      await this.database.close();
      this.database = null;
    }
  },

  async getDatabase() {
    if (!this.database) {
      this.database = await IndexedDB.open(this.dbName, DB_OPTIONS, db => {
        db.createObjectStore(this.dbName, { keyPath: "addonId" });
      });
    }

    return this.database;
  },

  async getStudyData(studyId) {
    const db = await this.getDatabase();

    return await db.objectStore(this.dbName, "readwrite").get(studyId);
  },

  async saveStudyData(study) {
    const {
      name, // The unique name for the experiment
      version, // The add-on version
      description, // The add-on description
      installDate = Date.now(), // The install date
      studyEndDate = null, // The study end date (starts off null)
      addonId = study.id, // The add-on ID
      active = true, // The active status of the study (starts off true)
    } = study;


    const db = await this.getDatabase();

    return await db.objectStore(this.dbName, "readwrite")
      .put({
        name,
        version,
        description,
        installDate,
        studyEndDate,
        addonId,
        active,
      });
  },
};
