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
/******/ 	return __webpack_require__(__webpack_require__.s = "./client/actions/opt-out-study/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client/actions/opt-out-study/index.js":
/*!***********************************************!*\
  !*** ./client/actions/opt-out-study/index.js ***!
  \***********************************************/
/*! exports provided: default, postExecutionHook */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return OptOutStudyAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "postExecutionHook", function() { return postExecutionHook; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./client/actions/utils.js");


const SHIELD_OPT_OUT_PREF = 'app.shield.optoutstudies.enabled';

let seenRecipeIds = [];

/**
 * Enrolls a user in an opt-out study, in which we install an add-on which
 * manages branch selection, changes to Firefox, etc.
 */
class OptOutStudyAction extends _utils__WEBPACK_IMPORTED_MODULE_0__["Action"] {
  async execute() {
    const recipeId = this.recipe.id;
    const {
      name, description, addonUrl, isEnrollmentPaused,
    } = this.recipe.arguments;
    const { preferences, studies } = this.normandy;

    // Exit early if we're on an incompatible client.
    if (studies === undefined) {
      this.normandy.log('Client does not support studies, aborting.', 'info');
      return;
    }

    // Check opt-out preference
    if (preferences && !preferences.getBool(SHIELD_OPT_OUT_PREF, false)) {
      this.normandy.log('User has opted-out of opt-out experiments, aborting.', 'info');
      return;
    }

    seenRecipeIds.push(recipeId);

    const hasStudy = await studies.has(recipeId);
    if (isEnrollmentPaused) {
      this.normandy.log(`Enrollment is paused for recipe ${recipeId}`, 'debug');
    } else if (hasStudy) {
      this.normandy.log(`Study for recipe ${recipeId} already exists`, 'debug');
    } else {
      this.normandy.log(`Starting study for recipe ${recipeId}`, 'debug');
      await studies.start({
        recipeId,
        name,
        description,
        addonUrl,
      });
    }
  }
}
Object(_utils__WEBPACK_IMPORTED_MODULE_0__["registerAction"])('opt-out-study', OptOutStudyAction);

/**
 * Finds active studies that were not stored in the seenRecipeIds list during
 * action execution, and stops them.
 */
async function postExecutionHook(normandy) {
  const { studies } = normandy;

  // Exit early if we're on an incompatible client.
  if (studies === undefined) {
    normandy.log('Client does not support studies, aborting.', 'info');
    return;
  }

  // If any of the active studies were not seen during a run, stop them.
  const activeStudies = (await studies.getAll()).filter(study => study.active);
  for (const study of activeStudies) {
    if (!seenRecipeIds.includes(study.recipeId)) {
      normandy.log(`Stopping study for recipe ${study.recipeId}.`, 'debug');
      try {
        await studies.stop(study.recipeId, 'recipe-not-seen');
      } catch (err) {
        normandy.log(`Error while stopping study for recipe ${study.recipeId}: ${err}`, 'error');
      }
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
//# sourceMappingURL=opt-out-study.js.map