const testsContext = require.context('./', true, /test_[^//]*\.js$/);
testsContext.keys().forEach(testsContext);
