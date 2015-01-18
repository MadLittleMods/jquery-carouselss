(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './get-css-keyframe-list', './get-duration-info'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'), require('./get-css-keyframe-list'), require('./get-duration-info'));
	} else {
		// Browser globals (root is window)
		root.getMaxAnimationDuration = factory(root.$, root.getCSSKeyframeList, root.getDurationInfo);
	}
}(this, function($, getCSSKeyframeList, getDurationInfo) {

	"use strict";


	// Returns the maximum animation duration affecting a element
	// We check for multiple animations and whether the keyframe declarations exist
	//
	// Unit Tests: http://jsfiddle.net/MadLittleMods/ag2y7654/
	function getMaxAnimationDuration(element) {
		element = $(element);
		var nameString = element.css('animation-name') || undefined;
		
		// Make sure there actually is animation(s) defined in the declaration
		if(nameString && nameString != 'none') {
			// We use this to make sure the corresponding keyframes exist
			var cssKeyframeList = getCSSKeyframeList();

			var durationInfo = getDurationInfo(element.css('animation-name'), element.css('animation-duration'));
			var currentValidatedLongestDuration = false;
			
			// There could be multiple, so split it up and iterate
			var names = nameString.split(/,\s*/);
			for(var i = 0; i < names.length; i++) {
				var name = names[i];
				
				var keyframesExist = cssKeyframeList[name];
				
				if(keyframesExist) {
					var duration = durationInfo.map[name];
					if(duration > currentValidatedLongestDuration) {
						currentValidatedLongestDuration = duration;
					}
					
				}
			}
			
			return currentValidatedLongestDuration;
		}
		
		return false;
	}



	return getMaxAnimationDuration;

}));