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
		root.mod = factory();
	}
}(this, function() {

	"use strict";

	
	// A better modulo function that works the way you expect
	function mod(x, m) {
		return (x%m + m)%m;
	}


	return mod;

}));