var testsContext = require.context("./", false, /\.js$/);
testsContext.keys().forEach(testsContext);
