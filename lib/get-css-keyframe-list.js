(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.getCSSKeyframeList = factory();
	}
}(this, function() {

	"use strict";

	// Returns any defined CSS keyframes in the document
	function getCSSKeyframeList() {
		var keyframeList = {},
			CSSKeyframesRule = window.CSSKeyframesRule || false;

		for(var stylesheetIndex = 0; stylesheetIndex < document.styleSheets.length; stylesheetIndex++) {
			var stylesheet = document.styleSheets[stylesheetIndex];

			var rules = stylesheet.cssRules || stylesheet.rules;
			if(rules) {
				for(var i = 0; i < rules.length; i++) {
					var rule = rules[i];

					// Make sure it is the right type of rule
					if(CSSKeyframesRule && rule instanceof CSSKeyframesRule) {
						//console.log('found:', rule.name);
						keyframeList[rule.name] = true;
					}
				}
			}
		}

		return keyframeList;
	}


	return getCSSKeyframeList;

}));