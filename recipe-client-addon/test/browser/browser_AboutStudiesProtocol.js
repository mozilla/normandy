"use strict";

Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm", this);
Cu.import("resource://shield-recipe-client/lib/AboutStudiesProtocol.jsm", this);

const sandboxManager = new SandboxManager();
sandboxManager.addHold("test running");

// Test un/register for basic errors.
add_task(async function() {
  let passed = true;
  try {
    AboutStudiesProtocol.register();
    AboutStudiesProtocol.unregister();
  } catch (e) {
    passed = false;
  }
  Assert.ok(passed, "Did not throw when un/registering about:studies");
});

// Test 'one-sided' protocol unregistration. Determines if the protocol throws an
// error if it is asked to unregister while not already registered.
add_task(async function() {
  let passed = true;
  try {
    AboutStudiesProtocol.unregister();
  } catch (e) {
    passed = false;
  }
  Assert.ok(passed, "Did not throw when removing a non-registered about:studies protocol");
});

// Test to determine the `about:studies` page is actually loaded and displayed in
// the browser.
add_task(async function() {
  AboutStudiesProtocol.register();

  await BrowserTestUtils.withNewTab("about:studies", (tab) => {
    // Grab the HTMLDocument from the tab's XULDocument. This allows us to
    // perform basic DOM searches in the tab to determine if the content matches
    // what we expect.
    const dom = tab.contentDocument;
    const aboutPage = dom.querySelector("#about-studies-page");

    // About page should exist, and the content `Hello world!` should be present.
    Assert.ok(!!aboutPage, "Found about:studies page");
    Assert.equal(aboutPage.querySelector("h1").textContent, "about:studies", "Correct header content.");
    Assert.equal(aboutPage.querySelector("p").textContent, "Hello world!", "Correct text content.");
  });

  AboutStudiesProtocol.unregister();
});

// Cleanup
add_task(async function() {
  // Unregister the protocol, just in case.
  AboutStudiesProtocol.unregister();

  // Make sure the sandbox is clean.
  sandboxManager.removeHold("test running");
  await sandboxManager.isNuked()
    .then(() => ok(true, "sandbox is nuked"))
    .catch(e => ok(false, "sandbox is nuked", e));
});
