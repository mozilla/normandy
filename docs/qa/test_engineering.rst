Normandy Test Engineering
=========================
This is the repository for all information related to test engineering for the Normandy project.  This will outline our resources and test process for releases.

The primary focus of testing will be on the Firefox client and the API server. The Normandy Firefox client follows the release process and train schedule for the Firefox browser. The Normandy server is tested using the API server and recipes.

The Delivery Console is not currently being tested, as it’s a much lower priority. 

The test strategy incorporates manual and automated testing. Different approaches are outlined for each area. 

Normandy Server
---------------
The Normandy Server is an API server with recipes. This feature is high priority, and needs to maintain a high level of service. There are two versions with different functionality. V1 is the server clients connect to. V3 is the server that Admins connect to.

* v1
	* Automation:
	* Test Engineer: chartjes
	* **Status:**  In process

* v3
	* Automation:
	* Test Engineer: b4hand
	* Manual tests: none
	* **Status:** In process

Normandy Firefox client
-----------------------
The Normandy Firefox client queries the Normandy server for instructions and picks up recipe changes. 

* QA: cmuresan
* Automation: 
* Test Engineer: b4hand
* _Manual tests: https://testrail.stage.mozaws.net/index.php?/suites/view/232&group_by=cases:section_id&group_order=asc&group_id=16918
* **Status:** b4hand is reviewing and fixing outdated UI Automation tests. Ciprian is reviewing and updating manual tests.

Normandy Delivery Console
-------------------------
This is a tool to edit API recipes by Admins. It’s also referred to as the Admin panel. It is a single page application that is only used by internal users. If there is a problem it is reported by internal users, and is considered an inconvenience, not a high priority.

* QA/Test Engineer: none
* _Automation: https://github.com/18epedersen/Normandy-e2e-tests
	* **Status:** needs updating
* _Manual tests: https://testrail.stage.mozaws.net/index.php?/suites/view/232&group_by=cases:section_id&group_order=asc&group_id=16918
	* **Status:** Needs more tests. The manual tests are extremely basic.

GCP Migration
-------------
Has been completed as of 2019 Q1. It is currently being reviewed to determine if additional work needs to be done.