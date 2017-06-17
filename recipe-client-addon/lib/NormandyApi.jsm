/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu, classes: Cc, interfaces: Ci} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/LogManager.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "CanonicalJSON", "resource://gre/modules/CanonicalJSON.jsm");
XPCOMUtils.defineLazyModuleGetter(
  this, "InvalidSignatureError", "resource://shield-recipe-client/lib/Errors.jsm");

Cu.importGlobalProperties(["fetch", "URL"]); /* globals fetch, URL */

this.EXPORTED_SYMBOLS = ["NormandyApi"];

const log = LogManager.getLogger("normandy-api");
const prefs = Services.prefs.getBranch("extensions.shield-recipe-client.");

let indexPromise = null;

this.NormandyApi = {
  clearIndexCache() {
    indexPromise = null;
  },

  apiCall(method, endpoint, data = {}) {
    const url = new URL(endpoint);
    method = method.toLowerCase();

    let body = undefined;
    if (data) {
      if (method === "get") {
        for (const key of Object.keys(data)) {
          url.searchParams.set(key, data[key]);
        }
      } else if (method === "post") {
        body = JSON.stringify(data);
      }
    }

    const headers = {"Accept": "application/json"};
    return fetch(url.href, {method, body, headers});
  },

  get(endpoint, data) {
    return this.apiCall("get", endpoint, data);
  },

  post(endpoint, data) {
    return this.apiCall("post", endpoint, data);
  },

  absolutify(url) {
    const apiBase = prefs.getCharPref("api_url");
    const server = new URL(apiBase).origin;
    if (url.startsWith("http")) {
      return url;
    } else if (url.startsWith("/")) {
      return server + url;
    }
    throw new Error("Can't use relative urls");
  },

  async getApiUrl(name) {
    if (!indexPromise) {
      const apiBase = new URL(prefs.getCharPref("api_url"));
      if (!apiBase.pathname.endsWith("/")) {
        apiBase.pathname += "/";
      }
      indexPromise = this.get(apiBase.toString()).then(res => res.json());
    }
    const index = await indexPromise;
    if (!(name in index)) {
      throw new Error(`API endpoint with name "${name}" not found.`);
    }
    const url = index[name];
    return this.absolutify(url);
  },

  async fetchRecipes(filters = {enabled: true}) {
    const signedRecipesUrl = await this.getApiUrl("recipe-signed");
    const recipesResponse = await this.get(signedRecipesUrl, filters);
    const rawText = await recipesResponse.text();
    const recipesWithSigs = JSON.parse(rawText);

    const verifiedRecipes = [];

    for (const {recipe, signature: {signature, x5u}} of recipesWithSigs) {
      const serialized = CanonicalJSON.stringify(recipe);
      if (!rawText.includes(serialized)) {
        log.debug(rawText, serialized);
        throw new InvalidSignatureError("Canonical recipe serialization does not match!");
      }

      const certChainResponse = await this.get(this.absolutify(x5u));
      const certChain = await certChainResponse.text();
      const builtSignature = `p384ecdsa=${signature}`;

      const verifier = Cc["@mozilla.org/security/contentsignatureverifier;1"]
        .createInstance(Ci.nsIContentSignatureVerifier);

      let valid;
      try {
        valid = verifier.verifyContentSignature(
          serialized,
          builtSignature,
          certChain,
          "normandy.content-signature.mozilla.org"
        );
      } catch (err) {
        throw new InvalidSignatureError(`Recipe signature validation failed: ${err}`);
      }

      if (!valid) {
        throw new InvalidSignatureError("Recipe signature is not valid");
      }

      verifiedRecipes.push(recipe);
    }

    log.debug(
      `Fetched ${verifiedRecipes.length} recipes from the server:`,
      verifiedRecipes.map(r => r.name).join(", ")
    );

    return verifiedRecipes;
  },

  /**
   * Fetch metadata about this client determined by the server.
   * @return {object} Metadata specified by the server
   */
  async classifyClient() {
    const classifyClientUrl = await this.getApiUrl("classify-client");
    const response = await this.get(classifyClientUrl);
    const clientData = await response.json();
    clientData.request_time = new Date(clientData.request_time);
    return clientData;
  },

  /**
   * Fetch an array of available actions from the server.
   * @resolves {Array}
   */
  async fetchActions() {
    const actionApiUrl = await this.getApiUrl("action-list");
    const res = await this.get(actionApiUrl);
    return res.json();
  },

  async fetchImplementation(action) {
    const response = await fetch(action.implementation_url);
    if (response.ok) {
      return response.text();
    }

    throw new Error(`Failed to fetch action implementation for ${action.name}: ${response.status}`);
  },
};
