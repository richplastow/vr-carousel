/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/* global AFRAME */
	var styleParser = AFRAME.utils.styleParser;

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	AFRAME.registerComponent('event-set', {
	  schema: {
	    default: '',
	    parse: function (value) {
	      var obj = styleParser.parse(value);
	      // Convert camelCase keys from styleParser to hyphen.
	      var convertedObj = {};
	      Object.keys(obj).forEach(function (key) {
	        var hyphened = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	        convertedObj[hyphened] = obj[key];
	      });
	      return convertedObj;
	    }
	  },

	  multiple: true,

	  init: function () {
	    this.eventHandler = null;
	    this.eventName = null;
	  },

	  update: function (oldData) {
	    this.removeEventListener();
	    this.updateEventListener();
	    this.addEventListener();
	  },

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function () {
	    this.removeEventListener();
	  },

	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function () {
	    this.removeEventListener();
	  },

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function () {
	    this.addEventListener();
	  },

	  /**
	   * Update source-of-truth event listener registry.
	   * Does not actually attach event listeners yet.
	   */
	  updateEventListener: function () {
	    var data = this.data;
	    var el = this.el;

	    // Set event listener using `_event`.
	    var event = data._event;
	    var target = data._target;
	    delete data._event;
	    delete data._target;

	    // Decide the target to `setAttribute` on.
	    var targetEl = target ? el.sceneEl.querySelector(target) : el;

	    this.eventName = event;
	    this.eventHandler = function handler () {

        $(window).trigger('vrc-shape-' + event, this);
        if ('mouseenter' !== event && 'mouseleave' !== event) {
          console.log(event);
        }
        // if ('mouseenter' === event) {
          // document.body.classList.add('vrc-cursor-hover');
        // } else {
          // document.body.classList.remove('vrc-cursor-hover');
        // };

	      // // Set attributes.
	      // Object.keys(data).forEach(function setAttribute (propName) {
        //
	      //   AFRAME.utils.entity.setComponentProperty.call(this, targetEl, propName,
	      //                                                 data[propName]);
	      // });
	    };
	  },

	  addEventListener: function () {
	    this.el.addEventListener(this.eventName, this.eventHandler);
	  },

	  removeEventListener: function () {
	    this.el.removeEventListener(this.eventName, this.eventHandler);
	  }
	});


/***/ }
/******/ ]);
