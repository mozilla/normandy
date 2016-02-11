const {RecipeRunner} = require('./lib/RecipeRunner.js');
const {SelfRepairInteraction} = require('./lib/SelfRepairInteraction.js');

exports.main = function({loadReason}) {
  SelfRepairInteraction.disableSelfRepair();
  RecipeRunner.init();
};

exports.onUnload = function() {
  SelfRepairInteraction.enableSelfRepair();
};
