const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
const tabs = require("sdk/tabs");
const testRunner = require('sdk/test');
const {before, after} = require('sdk/test/utils');

const {Heartbeat} = require('../lib/Heartbeat.js');


let targetWindow;
let notificationBox;

exports['test it shows a heartbeat panel'] = assert => {
  assert.equal(notificationBox.childElementCount, 0);
  new Heartbeat(targetWindow, {testing: true});
  assert.equal(notificationBox.childElementCount, 1);
};

exports['test it shows five stars when there is no engagementButtonLabel'] = assert => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    engagementButtonLabel: undefined,
  });
  assert.equal(hb.notice.querySelectorAll('.star-x').length, 5);
  assert.equal(hb.notice.querySelectorAll('.notification-button').length, 0);
};

exports['test it shows a button when there is an engagementButtonLabel'] = assert => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    engagementButtonLabel: 'Click me!',
  });
  assert.equal(hb.notice.querySelectorAll('.star-x').length, 0);
  assert.equal(hb.notice.querySelectorAll('.notification-button').length, 1);
};

exports['test it shows a learn more link'] = assert => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    learnMoreMessage: 'Learn More',
    learnMoreURL: 'https://example.org/learnmore',
  });
  let learnMoreEl = hb.notice.querySelector('.text-link');
  assert.equal(learnMoreEl.href, 'https://example.org/learnmore');
  assert.equal(learnMoreEl.value, 'Learn More');
};

exports['test it shows the message'] = assert => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    message: 'oh hai',
  });
  let messageEl = targetWindow.document.getAnonymousElementByAttribute(
    hb.notice,
    'anonid',
    'messageText'
  );
  assert.equal(messageEl.textContent, 'oh hai');
};

exports['test it pings telemetry'] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    message: 'oh hai',
  });

  hb.events.on('TelemetrySent', payload => {
    assert.ok(isOrdered([0, payload.offeredTS, payload.closedTS]));
    done();
  });

  // triggers sending ping to normandy
  closeAllNotifications();
};

exports['test it includes learnMoreTS if learn more is clicked'] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    message: 'oh hai',
    learnMoreMessage: 'Learn More',
    learnMoreURL: 'https://example.org/learnmore',
  });

  hb.events.on('TelemetrySent', payload => {
    assert.ok(isOrdered([0, payload.offeredTS, payload.learnMoreTS, payload.closedTS]));
    // Close learn more tab
    tabs[tabs.length - 1].close();
    done();
  });

  let learnMoreEl = hb.notice.querySelector('.text-link');
  learnMoreEl.click();

  // triggers sending ping to normandy
  closeAllNotifications();
};

exports['test it opens an engagement page after interaction'] = (assert, done) => {
  let hb = new Heartbeat(targetWindow, {
    testing: true,
    message: 'oh hai',
    engagementButtonLabel: 'Engage whooo',
    postAnswerURL: 'https://www.example.org/engaging',
  });

  tabs.on('ready', (tab) => {
    assert.equal(tabs.activeTab.url, 'https://www.example.org/engaging');
    // Close engagement tab
    tabs[tabs.length - 1].close();
    done();
  });

  let engagementEl = hb.notice.querySelector('.notification-button');
  engagementEl.click();
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
function isOrdered(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) {
      return false;
    }
  }
  return true;
}

/** Close all but one tab, since jpm requires this at the end of a test */
function onlyOneTab () {
  let first = true;
  for (let tab of tabs) {
    if (first) {
      first = false;
      continue;
    }
    tab.close();
  }
}

before(exports, (testName, assert, done) => {
  targetWindow = Services.wm.getMostRecentWindow('navigator:browser');
  notificationBox = targetWindow.document.querySelector('#high-priority-global-notificationbox');

  closeAllNotifications().then(done);
});

testRunner.run(exports);
