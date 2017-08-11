Normandy-e2e-tests
====================


Summary
-------
Suite of end-2-end tests for Mozilla's Normandy Control Shield UI. 


Each script in the tests subdirectory exercises a different workflow of the UI. The tests are ordered 1-8. The tests run sequentially, and the first (test1) will run first, and the last (test8) test will run last.


The workflows tested are:

2. Filling out the recipe form
3. Editing a recipe
4. Approving a recipe
5. Publishing a recipe
6. Disabling a recipe
7. Cloning a recipe
8. Verifying that recipes created in the UI are created in the restful api endpoint
9. Uploading a web extension

Tests 7 and 8 are skipped, which is addressed in issues #11 and #9, respectively.


Install
-------


To install the requirements for the tests:

```
pip install -rrequirements.txt
```

Setup
-------

The tests require a config.ini file with variables and confidental credentials. However, I cannot provide the config.ini file here because of the LDAP username, LDAP password, and QR code secret. Therefore, I've provided a config.ini-dist file as a template.

Please copy over the contents of config.ini-dist into a new file called config.ini in your project home directory. In config.ini, fill in the fields for username, password, and QR secret. The QR secret is the QR code associated with a Google Authenticator account if a user chooses to authenicate with a 6 digit passcode.

Also note if the UI has changed since 8/11/17, you may need to update pages/locators.py. Locators.py is the module that stores all the locators for the selenium webdriver.

Run
-------
Note, to run the tests, you must be connected to the Mozilla VPN server.

To run all the tests sequentially:

```
tox
```

If you want to run a specific test, run:

```
tox -e test_name
```

For example:

```
tox -e approve_recipe
```

Due to timing constraints of duo authentication, the tests are a bit flaky. 

Therefore after the first test, each test begins with a time.sleep(30). This is because if two tests run sequentially without a sleep, the following test may use the some QR code as the previous test for logging into duo authentication. This would cause the following test to automatically fail because QR codes cannot be reused within a short timespan.