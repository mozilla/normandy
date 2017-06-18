/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu, interfaces: Ci, manager: Cm, results: Cr} = Components;
Cm.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

this.EXPORTED_SYMBOLS = ["AboutStudiesProtocol"];


/**
 * Required data for registering a protocol handler. This data is referred to
 * when creating the new channel, as well as actually registering the
 * component factory.
 */
const protocolInfo = {
  // The file/destination for the protocol.
  uri: Services.io.newURI("resource://shield-recipe-client/lib/AboutStudies.html"),
  // Other properties are used internally by the protocol handler.
  classDescription: "about:studies page module",
  classID: Components.ID("c7c3dd48-c1cf-4bbf-a5df-69eaf6cb27d9"),
  contractID: "@mozilla.org/network/protocol/about;1?what=studies",
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIStudiesProtocolHandler]),
};

/**
 * Component definition for the about:studies protocol handler.
 * Registers a component with the browser that establishes an `about:studies`
 * protocol handler. Navigating to `about:studies` displays `AboutStudies.html`.
 */
class StudiesProtocolHandler {
  newChannel(uri) {
    let chan;
    try {
      chan = Services.io.newChannelFromURI2(
        protocolInfo.uri,
        null,
        Services.scriptSecurityManager.getSystemPrincipal(),
        null,
        Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL,
        Ci.nsIContentPolicy.TYPE_DOCUMENT
      );
    } catch (ex) {
      throw new Error(`Error creating about:studies protocol - ${ex}`);
    }

    return chan;
  }

  // Required by the protocol handler, despite not doing anything.
  getURIFlags() {}
}


/**
 * Protocol-handling manager. Exposes functions to un/register the protocol
 * handler, effectively enabling or disabling the ability for users to navigate
 * to `about:studies`.
 */
const AboutStudiesProtocol = {
  instance: null,

  /**
   * Enable the `about:studies` protocol handler.
   */
  register() {
    // We only need to register the component once.
    if (this.instance) {
      return;
    }

    // Component factory definition for the protocol handler,
    // required for Cm.registerFactory.
    const protocolFactory = {
      createInstance(outer) {
        if (outer) {
          throw Cr.NS_ERROR_NO_AGGREGATION;
        }
        return new StudiesProtocolHandler();
      }
    };

    const {
      classID,
      classDescription,
      contractID
    } = protocolInfo;

    // Actually register the component (and therefor protocol) with the browser.
    Cm.registerFactory(classID, classDescription, contractID, protocolFactory);

    // Save the registered factory's information, to unregister later.
    this.instance = protocolFactory;
  },

  /**
   * Unregister component, disabling the `about:studies` handler.
   */
  unregister() {
    if (this.instance) {
      const {classID} = protocolInfo;
      Cm.unregisterFactory(classID, this.instance);
    }

    this.instance = null;
  }
};
