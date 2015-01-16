(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function() {
			return factory();
		});
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.cssTimeValueToSeconds = factory();
	}
}(this, function () {

	"use strict";

	// Converts CSS time value string(ex. "1s" or "10ms") to a number in seconds
	function cssTimeValueToSeconds(cssTimeValue) {
		var matches = (cssTimeValue || '').match(/(\d*?\.?\d*?)(s|ms)/i);
		var timeValue = parseFloat(matches[1], 10) * (matches[2] === "ms" ? 0.001 : 1);
		
		return timeValue;
	}

	
	return cssTimeValueToSeconds;

}));