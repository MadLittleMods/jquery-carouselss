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
		root.checkForPropertyChange = factory();
	}
}(this, function () {

	"use strict";

	
	// Params:
	// property: string - Accepts a css property name. Also syntax for transition properties (this includes "all")
	// before: object output from `css(...)`
	// after: object output from `css(...)`
	function checkForPropertyChange(property, before, after) {
		var hasSomethingChanged = false;
		if(property === 'all') {
			// Loop through all of the properties and find one that has changed
			var propertyKeys = Object.keys(before);
			for(var propIndex = 0; propIndex < propertyKeys.length; propIndex++) {
				var key = propertyKeys[propIndex];
				if(before[key] != after[key]) {
					hasSomethingChanged = true;
					break;
				}
			}
		}
		else {
			// Use jquery to find if different because it could be shorthand etc
			hasSomethingChanged = $('<div></div>').css(before).css(property) != $('<div></div>').css(after).css(property);
		}

		return hasSomethingChanged;
	}



	return checkForPropertyChange;

}));