  /* global exports:true, require:false */
const {Cu} = require("chrome");
const tabs = require("sdk/tabs");
const {browserWindows} = require("sdk/windows");
const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

Cu.import("resource://gre/modules/Services.jsm");

const {Loader, Require} = require("toolkit/loader");
const loader = new Loader({
  paths: {
    "": "resource://gre/modules/commonjs/",
    lib: "resource://shield-recipe-client-at-mozilla-dot-org/lib",
    test: "resource://shield-recipe-client-at-mozilla-dot-org/test",
  },
});
const extRequire = new Require(loader, module);

const {Heartbeat} = extRequire("lib/Heartbeat.js");
const {SandboxManager} = extRequire("lib/SandboxManager.js");
const {NormandyDriver} = extRequire("lib/NormandyDriver.js");

let sandboxManager;
let targetWindow;
let notificationBox;

let eventEmitter;

exports["test it shows a heartbeat panel"] = assert => {
  let preCount = notificationBox.childElementCount;
  new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
  });
  assert.equal(notificationBox.childElementCount, preCount + 1, "wrong number of notifications open");
};

exports["test it shows five stars when there is no engagementButtonLabel"] = assert => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    engagementButtonLabel: undefined,
  });
  assert.equal(hb.notice.querySelectorAll(".star-x").length, 5, "wrong number of stars");
  assert.equal(hb.notice.querySelectorAll(".notification-button").length, 0, "engagement button shown when not expected");
};

exports["test it shows a button when there is an engagementButtonLabel"] = assert => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    engagementButtonLabel: "Click me!",
  });
  assert.equal(hb.notice.querySelectorAll(".star-x").length, 0, "stars shown when unexpected");
  const engagementButton = hb.notice.querySelector(".notification-button");
  assert.ok(engagementButton, "engagement button was not added");
  assert.equal(engagementButton.label, "Click me!");
};

exports["test it shows a learn more link"] = assert => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    learnMoreMessage: "Learn More",
    learnMoreUrl: "https://example.org/learnmore",
  });
  let learnMoreEl = hb.notice.querySelector(".text-link");
  assert.equal(learnMoreEl.href, "https://example.org/learnmore", "learn more url wrong");
  assert.equal(learnMoreEl.value, "Learn More", "learn more label wrong");
};

exports["test it shows the message"] = assert => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
  });
  let messageEl = targetWindow.document.getAnonymousElementByAttribute(
    hb.notice,
    "anonid",
    "messageText"
  );
  assert.equal(messageEl.textContent, "test", "heartbeat prompt showed wrong message");
};

exports["test it pings telemetry"] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
  });

  hb.eventEmitter.on("TelemetrySent", payload => {
    assertOrdered(assert, [0, payload.offeredTS, payload.closedTS, Date.now()]);
    done();
  });

  // triggers sending ping to normandy
  closeAllNotifications();
};

exports["test it includes learnMoreTS in payload if learn more is clicked"] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    learnMoreMessage: "Learn More",
    learnMoreUrl: "https://example.org/learnmore",
  });

  hb.eventEmitter.on("TelemetrySent", payload => {
    assertOrdered(assert, [0, payload.offeredTS, payload.learnMoreTS, payload.closedTS, Date.now()]);
    // Close learn more tab
    tabs[tabs.length - 1].close();
    done();
  });

  let learnMoreEl = hb.notice.querySelector(".text-link");
  learnMoreEl.click();

  // triggers sending ping to normandy
  closeAllNotifications();
};

exports["test it opens an engagement page after interaction"] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
    testing: true,
    flowId: "test",
    message: "test",
    engagementButtonLabel: "Engage whooo",
    postAnswerUrl: "about:about",
  });

  tabs.on("ready", () => {
    assert.equal(tabs.activeTab.url, "about:about", "wrong url loaded in learn more tab");
    // Close engagement tab
    tabs[tabs.length - 1].close();
    done();
  });

  let engagementEl = hb.notice.querySelector(".notification-button");
  engagementEl.click();
};

exports["test it sends telemetry when the window is closed"] = (assert, done) => {
  browserWindows.open({
    url: "about:blank",
    onOpen: () => {
      targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
      let hb = new Heartbeat(targetWindow, eventEmitter, sandboxManager, {
        testing: true,
        flowId: "test",
        message: "test",
      });

      hb.eventEmitter.on("TelemetrySent", payload => {
        assertOrdered(assert, [0, payload.offeredTS, payload.windowClosedTS, Date.now()]);
        done();
      });

      // triggers sending ping to normandy
      targetWindow.close();
    },
  });
};

function closeAllNotifications() {
  if (notificationBox.allNotifications.length === 0) {
    return Promise.resolve();
  }

  let promises = [];

  for (let notification of notificationBox.allNotifications) {
    promises.push(waitForNotificationClose(notification));
    notification.close();
  }

  return Promise.all(promises);
}

function waitForNotificationClose(notification) {
  return new Promise(resolve => {
    let parent = notification.parentNode;

    let observer = new targetWindow.MutationObserver(mutations => {
      for (let mutation of mutations) {
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

/**
 * Check if an array is in non-descending order
 */
function assertOrdered(assert, arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    assert.ok(arr[i] <= arr[i + 1],
      `element ${i} (${arr[i]}) is not less than or equal to element ${i + 1} (${arr[i + 1]})`);
  }
}

before(exports, () => {
  targetWindow = Services.wm.getMostRecentWindow("navigator:browser");
  notificationBox = targetWindow.document.querySelector("#high-priority-global-notificationbox");
  sandboxManager = new SandboxManager();
  let driver = new NormandyDriver(sandboxManager);
  sandboxManager.addHold("test running");
  let sandboxedDriver = Cu.cloneInto(driver, sandboxManager.sandbox, {cloneFunctions: true});
  eventEmitter = new sandboxManager.sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
});

after(exports, (testName, assert, done) => {
  closeAllNotifications()
  .then(() => {
    sandboxManager.removeHold("test running");
    sandboxManager.assertNuked(assert, done);
  });
});

testRunner.run(exports);
