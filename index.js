const {RecipeRunner} = require('./lib/RecipeRunner.js');
const {SelfRepairInteraction} = require('./lib/SelfRepairInteraction.js');
const {Log} = require('./lib/Log.js');

exports.main = function({loadReason}) {
  SelfRepairInteraction.disableSelfRepair();
  Log.trace(`main: loadReason=${loadReason}`);
  RecipeRunner.init({waitForTabs: loadReason === 'startup'});
};

exports.onUnload = function() {
  SelfRepairInteraction.enableSelfRepair();
  RecipeRunner.uninit();
};
