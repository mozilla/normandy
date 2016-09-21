API Contract Tests
==================

These tests are designed to look for changes to the recipe server API that are
not expected.

To run these tests, use the following command from the root project directory.

.. code-block:: bash

    py.test -v --server=<server> contract-tests/

where `<server>` is one of:

* https://normandy-admin.stage.mozaws.net/ for staging testing
* https://normandy-admin.prod.mozaws.net/ for production testing

If you wish to send the test results to TestRail you need to have the
following in place:

1. VPN access to stage.mozaws.net sites
2. A valid account on `https://http://testrail.stage.mozaws.net/`

Then modify contract-tests/testrail.cfg.dist and fill in the details that
are required

.. code-block:: bash
    [API]
    url = https://testrail.stage.mozaws.net
    email = chartjes@mozilla.com
    password = <password for testrails>

    [TESTRUN]
    assignedto_id = <your user id>
    project_id = <project ID for Normandy>
    suite_id = <suite ID for Normandy>


Right now there are hardcoded values for the project ID and suite ID but these
could change if the TestRail instance is migrated somewhere else.

To send the results of the test to TestRail you run the tests using the
following command:

.. code-block:: bash
    py.test -v --server=<server> --testrail=contract-tests/testrail.cfg \
        --no-ssl-cert-check contract/tests

where `<server>` is one of:

* https://normandy-admin.stage.mozaws.net/ for staging testing
* https://normandy-admin.prod.mozaws.net/ for production testing

`--testrail` tells pytest where to find the TestRail configuration file

`--no-ssl-cert-check` is to tell pytest to not try and verify the SSL
certificate for the TestRail server because it is using a self-signed one
and the `Requests` library normally throws an excpetion about self-signed
SSL certificates.

Any test case that you want to have results reported to TestRail needs to
have a decorator on it so that pytest knows to grab the results:

.. code-block:: python
    @testrail('C1234')
    def test_something_import():
        ...


Every test case has an ID assigned to it by TestRail which you can see when
you look at the test cases inside TestRail. Add the decorator with the test
ID and you are all set to report results.

