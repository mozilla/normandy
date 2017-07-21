"use strict";

add_task(async function test_about_studies() {
  await BrowserTestUtils.withNewTab({gBrowser, url: "about:studies"}, async function(browser) {
    ok(browser.contentDocument.getElementById("app"), "App element was found");
  });
});
