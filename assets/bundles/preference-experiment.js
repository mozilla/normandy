/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./client/actions/preference-experiment/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client/actions/preference-experiment/index.js":
/*!*******************************************************!*\
  !*** ./client/actions/preference-experiment/index.js ***!
  \*******************************************************/
/*! exports provided: default, postExecutionHook */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return PreferenceExperimentAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "postExecutionHook", function() { return postExecutionHook; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./client/actions/utils.js");


const SHIELD_OPT_OUT_PREF = 'app.shield.optoutstudies.enabled';

let seenExperimentNames = [];

/**
 * Enrolls a user in a preference experiment, in which we assign the user to an
 * experiment branch and modify a preference temporarily to measure how it
 * affects Firefox via Telemetry.
 */
class PreferenceExperimentAction extends _utils__WEBPACK_IMPORTED_MODULE_0__["Action"] {
  async execute() {
    const {
      branches,
      isHighPopulation,
      isEnrollmentPaused,
      preferenceBranchType,
      preferenceName,
      preferenceType,
      slug,
    } = this.recipe.arguments;
    const experiments = this.normandy.preferenceExperiments;

    // Exit early if we're on an incompatible client.
    if (experiments === undefined) {
      this.normandy.log('Client does not support preference experiments, aborting.', 'info');
      return;
    }

    // Check opt-out preference
    const { preferences } = this.normandy;
    if (preferences && !preferences.getBool(SHIELD_OPT_OUT_PREF, false)) {
      this.normandy.log('User has opted-out of preference experiments, aborting.', 'info');
      return;
    }

    seenExperimentNames.push(slug);

    // If the experiment doesn't exist yet, enroll!
    const hasSlug = await experiments.has(slug);
    if (!hasSlug) {
      // If there's already an active experiment using this preference, abort.
      const activeExperiments = await experiments.getAllActive();
      const hasConflicts = activeExperiments.some(exp => exp.preferenceName === preferenceName);
      if (hasConflicts) {
        this.normandy.log(
          `Experiment ${slug} ignored; another active experiment is already using the
          ${preferenceName} preference.`, 'warn',
        );
        return;
      }

      // Determine if enrollment is currently paused for this experiment.
      if (isEnrollmentPaused) {
        this.normandy.log(`Enrollment is paused for experiment "${slug}"`, 'debug');
        return;
      }

      // Otherwise, enroll!
      const branch = await this.chooseBranch(branches);
      const experimentType = isHighPopulation ? 'exp-highpop' : 'exp';
      await experiments.start({
        name: slug,
        branch: branch.slug,
        preferenceName,
        preferenceValue: branch.value,
        preferenceBranchType,
        preferenceType,
        experimentType,
      });
    } else {
      // If the experiment exists, and isn't expired, bump the lastSeen date.
      const experiment = await experiments.get(slug);
      if (experiment.expired) {
        this.normandy.log(`Experiment ${slug} has expired, aborting.`, 'debug');
      } else {
        await experiments.markLastSeen(slug);
      }
    }
  }

  async chooseBranch(branches) {
    const { slug } = this.recipe.arguments;
    const ratios = branches.map(branch => branch.ratio);

    // It's important that the input be:
    // - Unique per-user (no one is bucketed alike)
    // - Unique per-experiment (bucketing differs across multiple experiments)
    // - Differs from the input used for sampling the recipe (otherwise only
    //   branches that contain the same buckets as the recipe sampling will
    //   receive users)
    const input = `${this.normandy.userId}-${slug}-branch`;

    const index = await this.normandy.ratioSample(input, ratios);
    return branches[index];
  }
}
Object(_utils__WEBPACK_IMPORTED_MODULE_0__["registerAction"])('preference-experiment', PreferenceExperimentAction);

/**
 * Finds active experiments that were not stored in the seenExperimentNames list
 * during action execution, and stop them.
 */
async function postExecutionHook(normandy) {
  // Exit early if we're on an incompatible client.
  if (normandy.preferenceExperiments === undefined) {
    normandy.log('Client does not support preference experiments, aborting.', 'info');
    return;
  }

  // If any of the active experiments were not seen during a run, stop them.
  const activeExperiments = await normandy.preferenceExperiments.getAllActive();
  for (const experiment of activeExperiments) {
    if (!seenExperimentNames.includes(experiment.name)) {
      await normandy.preferenceExperiments.stop(experiment.name, {
        resetValue: true,
        reason: 'recipe-not-seen',
      });
    }
  }
}
Object(_utils__WEBPACK_IMPORTED_MODULE_0__["registerAsyncCallback"])('postExecution', postExecutionHook);


/***/ }),

/***/ "./client/actions/utils.js":
/*!*********************************!*\
  !*** ./client/actions/utils.js ***!
  \*********************************/
/*! exports provided: Action, registerAction, registerAsyncCallback */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Action", function() { return Action; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "registerAction", function() { return registerAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "registerAsyncCallback", function() { return registerAsyncCallback; });
class Action {
  constructor(normandy, recipe) {
    this.normandy = normandy;
    this.recipe = recipe;
  }
}

// Attempt to find the global registerAction, and fall back to a noop if it's
// not available.
const registerAction = (
  (global && global.registerAction)
  || (window && window.registerAction)
  || function registerAction() {}
);

// Same as above, for registerAsyncCallback
const registerAsyncCallback = (
  (global && global.registerAsyncCallback)
  || (window && window.registerAsyncCallback)
  || function registerAsyncCallback() {}
);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })

/******/ });
//# sourceMappingURL=preference-experiment.js.map