(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['./css-time-value-to-seconds'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('./css-time-value-to-seconds'));
	} else {
		// Browser globals (root is window)
		root.getDurationInfo = factory(root.cssTimeValueToSeconds);
	}
}(this, function(cssTimeValueToSeconds) {

	"use strict";



	// Will return object containing a `maxKey` and `map` of duration to name
	// Also takes into account delays as an optional 3rd parameter
	//
	// Parameters:
	// `nameString`: `$element.css('animation-name')` or `$element.css('transition-name')`
	// `durationString`: `$element.css('animation-duration')` or `$element.css('transition-duration')`
	// `delayString`: $element.css('animation-delay')` or `$element.css('transition-delay')`
	function getDurationInfo(nameString, durationString, /*optional*/delayString) {
		var durationMap = {},
			maxDurationKey = false,
			maxDurationValue = false;
		
		if(nameString && durationString) {
			
			var names = (nameString || '').split(/,\s*/);
			var durations = (durationString || '').split(/,\s*/);
			var delays = (delayString || '').split(/,\s*/);
			
			for(var i = 0; i < names.length; i++) {
				var name = names[i];
				var duration = durations[i];
				var delay = delays[i];
				
				var durationValue = cssTimeValueToSeconds(duration);
				var delayValue = cssTimeValueToSeconds(delay);
				var timeTotal = delayValue + durationValue;
				
				
				// Keep track if there is actually a duration
				if(durationValue && durationValue > 0) {
					durationMap[name] = timeTotal;
				}
				
				// Keep track of the longest duration
				if(durationValue > 0 && timeTotal > maxDurationValue) {
					maxDurationKey = name;
					maxDurationValue = timeTotal;
				}
			}
		}
		
		return {
			maxKey: maxDurationKey,
			map: durationMap
		};
	}



	return getDurationInfo;

}));