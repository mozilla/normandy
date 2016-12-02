/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
// const tabs = require("sdk/tabs");
// const {browserWindows} = require("sdk/windows");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://shield-recipe-client/lib/Heartbeat.jsm", this);
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm", this);
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm", this);
Cu.import("resource://shield-recipe-client/lib/Log.jsm", this);


/**
 * Check if an array is in non-descending order
 */
function assertOrdered(arr) {
  for (let i = 0; i < arr.length; i++) {
    Assert.equal(typeof arr[i], "number", `elemenent ${i} is type "number"`);
  }
  for (let i = 0; i < arr.length - 1; i++) {
    Assert.lessOrEqual(arr[i], arr[i + 1],
      `element ${i} is less than or equal to element ${i + 1}`);
  }
}

function closeAllNotifications(targetWindow, notificationBox) {
  if (notificationBox.allNotifications.length === 0) {
    return Promise.resolve();
  }

  const promises = [];

  for (const notification of notificationBox.allNotifications) {
    promises.push(waitForNotificationClose(targetWindow, notification));
    notification.close();
  }

  return Promise.all(promises);
}

function waitForNotificationClose(targetWindow, notification) {
  return new Promise(resolve => {
    const parent = notification.parentNode;

    const observer = new targetWindow.MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          if (mutation.removedNodes.item(i) === notification) {
            observer.disconnect();
            resolve();
          }
        }
      }
    });
    observer.observe(parent, {childList: true});
  });
}


const sandboxManager = new SandboxManager();
const driver = new NormandyDriver(sandboxManager);
sandboxManager.addHold("test running");
const sandboxedDriver = Cu.cloneInto(driver, sandboxManager.sandbox, {cloneFunctions: true});


// Several of the behaviors of heartbeat prompt are mutually exclusive, so checks are broken up
// into three batches.

/* Batch #1 - General UI, Stars, and telemetry data */
add_task(function* () {
  const eventEmitter = new sandboxManager.sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
  const targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
  const notificationBox = targetWindow.document.querySelector("#high-priority-global-notificationbox");

  const preCount = notificationBox.childElementCount;
  const hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    engagementButtonLabel: undefined,
    learnMoreMessage: "Learn More",
    learnMoreUrl: "https://example.org/#learnmore",
  });

  const learnMoreEl = hb.notice.querySelector(".text-link");
  const messageEl = targetWindow.document.getAnonymousElementByAttribute(hb.notice, "anonid", "messageText");
  learnMoreEl.click();

  // Check UI
  Assert.equal(notificationBox.childElementCount, preCount + 1, "Correct number of notifications open");
  Assert.equal(hb.notice.querySelectorAll(".star-x").length, 5, "Correct number of stars");
  Assert.equal(hb.notice.querySelectorAll(".notification-button").length, 0, "Engagement button not shown");
  Assert.equal(learnMoreEl.href, "https://example.org/#learnmore", "Learn more url correct");
  Assert.equal(learnMoreEl.value, "Learn More", "Learn more label correct");
  Assert.equal(messageEl.textContent, "test", "Message is correct");

  const telemetryCheckDeferred = {resolved: undefined};
  const telemetryCheckPromise = new Promise(resolve => { telemetryCheckDeferred.resolve = resolve; });
  hb.eventEmitter.once("TelemetrySent", payload => {
    Log.debug("@@@@", payload);
    assertOrdered([0, payload.offeredTS, payload.closedTS, Date.now()]);
    // Close learn more tab
    const learnMoreTab = targetWindow.gBrowser.tabs[targetWindow.gBrowser.tabs.length - 1];
    targetWindow.gBrowser.removeTab(learnMoreTab);
    telemetryCheckDeferred.resolve();
  });

  // triggers sending ping to normandy
  yield closeAllNotifications(targetWindow, notificationBox);
  yield telemetryCheckPromise;
});


// Batch #2 - Engagement buttons
add_task(function* () {
  const eventEmitter = new sandboxManager.sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
  const targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
  const notificationBox = targetWindow.document.querySelector("#high-priority-global-notificationbox");
  const hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    engagementButtonLabel: "Click me!",
    postAnswerUrl: "https://example.org/#postAnswer",
    learnMoreMessage: "Learn More",
    learnMoreUrl: "https://example.org/#learnMore",
  });
  const engagementButton = hb.notice.querySelector(".notification-button");

  Assert.equal(hb.notice.querySelectorAll(".star-x").length, 0, "Stars not shown");
  Assert.ok(engagementButton, "Engagement button added");
  Assert.equal(engagementButton.label, "Click me!", "Engagement button has correct label");

  const tabUrlDeferred = {resolved: undefined};
  const tabUrlPromise = new Promise(resolve => { tabUrlDeferred.resolve = resolve; });

  targetWindow.gBrowser.tabContainer.addEventListener("TabOpen", function onTabOpened(event) {
    targetWindow.gBrowser.tabContainer.removeEventListener("TabOpen", onTabOpened);
    const tab = event.target;
    tab.addEventListener("load", function onTabLoaded() {
      tab.removeEventListener("load", onTabLoaded);
      Assert.equal(tab.url, "https://example.org/#learnMore", "correct url loaded in learn more tab");
      targetWindow.gBrowser.removeTab(tab);
      tabUrlDeferred.resolve();
    });
  });

  const engagementEl = hb.notice.querySelector(".notification-button");
  engagementEl.click();

  // triggers sending ping to normandy
  yield closeAllNotifications(targetWindow, notificationBox);
  yield tabUrlPromise;
});

// Batch 3 - Closing the window while heartbeat is open
add_task(function* () {
  const eventEmitter = new sandboxManager.sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
  const parentWindow = Services.wm.getMostRecentWindow("navigator:browser");

  let windowOpenResolve = null;
  const windowOpenPromise = new Promise(resolve => windowOpenResolve = resolve);
  const targetWindow = parentWindow.OpenBrowserWindow();
  targetWindow.addEventListener("load", function onLoad() {
    targetWindow.removeEventListener("load", onLoad);
    windowOpenResolve();
  });
  yield windowOpenPromise;

  const hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
  });

  let windowCloseResolve = {resolve: null};
  const windowClosePromise = new Promise(resolve => windowCloseResolve = resolve);
  hb.eventEmitter.once("TelemetrySent", payload => {
    assertOrdered([0, payload.offeredTS, payload.windowClosedTS, Date.now()]);
    windowCloseResolve();
  });

  // triggers sending ping to normandy
  targetWindow.close();
  yield windowClosePromise;
});


// Cleanup
add_task(function* () {
  sandboxManager.removeHold("test running");

  yield sandboxManager.isNuked()
    .then(() => ok(true, "sandbox is nuked"))
    .catch(e => ok(false, "sandbox is nuked", e));
});
