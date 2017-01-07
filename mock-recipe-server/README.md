# Mock Recipe Server

This project generates a set of static HTML files that mimic the
[recipe server][] API for a set of interesting test cases. They're built and
uploaded to S3 by our CI jobs to help QA test the [recipe client][] against
test data.

See the [documentation][] for more info.

[recipe server]: https://github.com/mozilla/normandy/tree/master/recipe-server
[recipe client]: https://github.com/mozilla/normandy/tree/master/recipe-client-addon
[documentation]: http://normandy.readthedocs.io/en/latest/dev/mock-recipe-server.html
