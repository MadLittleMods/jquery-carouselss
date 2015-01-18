(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './css', './get-duration-info', './check-for-property-change'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'), require('./css'), require('./get-duration-info'), require('./check-for-property-change'));
	} else {
		// Browser globals (root is window)
		root.getMaxTransitionDurationFromChange = factory(root.$, root.css, root.getDurationInfo, root.checkForPropertyChange);
	}
}(this, function($, css, getDurationInfo, checkForPropertyChange) {

	"use strict";



	// Pass in a element, and a callback that will be called to see if any properties on the elment have changed
	// Then we compare the properties that have changed to the properties that are going to transition
	//
	// Unit Tests: http://jsfiddle.net/MadLittleMods/vhr9qxqh/
	function getMaxTransitionDurationFromChange(element, changeFunc)
	{
		element = $(element);

		var currentLongestDuration = false;

		var durationInfo = getDurationInfo(
			element.css('transition-property'),
			element.css('transition-duration'),
			element.css('transition-delay')
		);

		// If there is a duration greater than zero then there is something to transition possibly
		if(durationInfo) {
			// Get a before and after snapshot
			var beforeDeprecatedCSS = css(element);
			changeFunc();
			var afterDeprecatedCSS = css(element);
			
			// Get the properties that will transition on this element
			var transitionProperties = (element.css('transition-property') || '').split(/,\s*/);
			
			// Check to see if any properties that are supposed to transition, actually changed to cause a transition
			for(var i = 0; i < transitionProperties.length; i++) {
				var property = transitionProperties[i];

				var hasPropertyChanged = checkForPropertyChange(property, beforeDeprecatedCSS, afterDeprecatedCSS);
				
				if(hasPropertyChanged) {
					var duration = durationInfo.map[property];
					if(duration > currentLongestDuration) {
						currentLongestDuration = duration;
					}
				}
			}
		}
		else {
			// They are still expecting the change
			// so we still need to run it but we don't have to do anything special
			changeFunc();
		}
		
		
		return currentLongestDuration;
	}



	return getMaxTransitionDurationFromChange;

}));