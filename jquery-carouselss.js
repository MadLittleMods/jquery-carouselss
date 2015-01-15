// CarouselSS
// A jQuery Carousel plugin. It listens to CSS transition/animation events when switching frames and uses CSS class-based states.
//
// https://github.com/MadLittleMods/jquery-carouselss
//
// By: Eric Eastwood: EricEastwood.com
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], (function($) {
			return factory($);
		})($));
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals (root is window)
		root.$ = root.$ || {}; // Make sure jQuery is set to atleast something
		root.$.carouselss = factory(root.$);
	}
}(this, function ($) {

	"use strict";


	// CarouselSS (`CSS`)
	var pluginName = "carouselss";


	// Default options
	var defaults = {
		// Time between the auto-advance goes to the next frame (in ms, 3000 = 3 seconds)
		// A negative value disables the auto-advance
		'interval': 3000,
		// Which frame (zero-indexed) of the thumbnail list we should start at.
		// This will be clamped to the available thumbnail indexes
		'startIndex': 0,
		// Selector used to find the thumbnails within the root carousel element
		'thumbnail': '.carousel-thumbnail',
		// Selector used to find the stage to put each frame as they cycle
		'stage': '.carousel-stage',
		// The class added to the wrapper "frame" element that contains the frame contents
		'stageFrameClass': 'carousel-frame',

		// Events

		// Gets executed every time the carousel moves to another frame
		// The move event can also be bound after plugin intialization using `$('.carousel').bind('carouselssmove', function() { });`
		'move': null
	};

	function Carousel(carousel_element, options) {


		this._defaults = defaults;
		this._name = pluginName;

		// If options exist, lets merge them with our default settings
		this.opts = $.extend({}, defaults, options);

		this.currentPosition = undefined;

		var $carouselElement = $(carousel_element);
		var $carouselStage = $carouselElement.find(this.opts.stage);
		var $thumbnailElements = $carouselElement.find(this.opts.thumbnail);

		// Used to keep track of the auto advance
		var carouselInterval;
		var currentFrame = null;

		var animationEndEventString = 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd';
		var transitionEndEventString = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd';

		var frameDelayMap = {};


		// We use this instead to allow for easy bind(init) and unbind(destroy)
		var currentBindings = [];
		var bind = function(element, selector, cb) {
			// If the element exists
			if(element.length > 0) {
				// Actually bind
				element.on(selector, cb);

				// Add it to the list to destroy later on
				currentBindings.push({
					'element': element,
					'selector': selector,
					'callback': cb
				});
			}
		};

		this.init = function() {
			var self = this;

			// Start the interval
			this.startInterval();

			// Hook when we are playing with the carousel, to not move around
			bind($carouselElement, 'mouseover', function () {
				// We don't want to change while they are messing with the carousel
				self.stopInterval();
			});
			bind($carouselElement, 'mouseleave', function () {
				// Reinstate the interval
				self.startInterval();
			});

			// Hook thumbnail for clicking and keyboard navigation
			$thumbnailElements = $carouselElement.find(this.opts.thumbnail);
			bind($thumbnailElements, 'click keydown',function (e) {
				// If click or spacebar, or enter is pressed
				if(e.type == 'click' || (e.type == 'keydown' && (e.keyCode == 32 || e.keyCode == 13))) {
					// Move to the selected position
					self.move($(this).index());

					// Restart the interval so we get adequate time on the new frame
					self.startInterval();

					e.preventDefault();
				}
			});

			// Reset the map
			// Something may have changed in the styles so we better look it up again.
			frameDelayMap = {};
		};

		this.destroy = function() {
			this.currentPosition = null;

			// Destroy the current frame
			// Don't worry about the delay from transition/animation so we pass in invalid frame index
			this.removeFrame(currentFrame, -1);

			// Clear the move interval
			this.stopInterval();

			// Unbind everything that was bound via `bind`
			for(var i = 0; i < currentBindings.length; i++) {
				var binding = currentBindings[i];
				binding.element.off(binding.selector, binding.callback);
			}
		};

		this.startInterval = function() {
			var self = this;

			// Make sure any previous interval is cleared
			this.stopInterval();

			if(this.opts.interval > 0) {
				// Set up an initial interval to move forward
				carouselInterval = setInterval(function() {
					self.next();
				}, this.opts.interval);
			}
		};

		this.stopInterval = function() {
			clearInterval(carouselInterval);
		};

		this.next = function() {
			// Move to the next position
			this.move(this.currentPosition+1);
		};

		this.prev = function() {
			// Move to the previous position
			this.move(this.currentPosition-1);
		};

		// Moves to the given index
		this.move = function(index) {
			// Make sure we aren't aready at that position and there are actually thumbnails
			if(this.currentPosition != index && $thumbnailElements.length > 0) {
				// Put the index in the array range
				index = mod(index, $thumbnailElements.length);
				
				//console.log('moving to: ' + index);

				var $thumbnail = $($thumbnailElements[index]);

				// Add the active class
				$thumbnailElements.each(function() {
					$(this).removeClass('is-active');
				});
				$thumbnail.addClass('is-active');

				// Clear out the old contents
				this.removeFrame(currentFrame, this.currentPosition);

				// Update the stage contents
				var newFrameContents = $thumbnail.contents().clone();
				newFrameContents.wrapAll('<div class="' + this.opts.stageFrameClass + '" data-position="' + index + '"></div>');
				newFrameContents = newFrameContents.parent();
				// Prepend it to the beginning of the stage
				// This ensures that the current frame is above the new frame so the current frame can "fade out"
				// Also the frames are behind any overlay in the stage as well
				currentFrame = newFrameContents.prependTo($carouselStage);

				// Update the carousel position
				this.currentPosition = index;

				// Trigger the `move` callback
				if(this.opts.move) {
					this.opts.move(jQuery.Event('move'));
				}
				// Also fire the qualified `move` event
				$carouselElement.trigger(pluginName + 'move', jQuery.Event('move'));
			}
		};

		this.removeFrame = function(frame, frameIndex) {
			if(frame) {
				//console.log('frametodel:', frame.attr('data-position'));

				// Look it up in the map
				var maxTransitionOrAnimationTime = frameDelayMap[frameIndex];
				// Otherwise add a value for this index
				if(maxTransitionOrAnimationTime == null) {
					var frameTransitionTime = getMaxTransitionDurationFromChange(frame, function() {
						frame.addClass('is-deprecated');
					});
					// Check animation AFTER the deprecated class is added from the check for transition above
					// This will ensure that any new animation from the class being added is ready
					var frameAnimationTime = getMaxAnimationDuration(frame);

					// Set the map
					frameDelayMap[frameIndex] = frameAnimationTime > frameTransitionTime ? frameAnimationTime : frameTransitionTime;
					// Update our running variable
					maxTransitionOrAnimationTime = frameDelayMap[frameIndex];
				}
				else {
					// On our first run, we do this in the check for transition/animation
					frame.addClass('is-deprecated');
				}

				var isCurrentFrameRemoved = false;
				var removeCurrentFrame = function() {
					if(!isCurrentFrameRemoved) {
						frame.remove();
					}
					isCurrentFrameRemoved = true;
				};

				// If there is a animation or transition with a duration > 0
				// Delete after animation/transition finishes
				// Otherwise we delete right away
				if(!maxTransitionOrAnimationTime) {
					removeCurrentFrame();
				}
				else {
					frame.one(animationEndEventString + ' ' + transitionEndEventString, function() {
						removeCurrentFrame();
					});
					// This is a safety-net in case the animation/transition event never fires
					// The animation/transition won't fire if you tab away and the frames keep on moving
					setTimeout(function() {
						removeCurrentFrame();
					}, (maxTransitionOrAnimationTime + 0.017)*1000); // We add a 60hz frame time to make up for waiting for the normal event firing
				}
			}
		};


		// In case they call it multiple times on the same element, clean up the prior instantiation
		this.destroy();
		// Then (re)make it.
		this.init();

		// Initialize the position
		this.move(this.opts.startIndex || 0);


	}

	$.fn[pluginName] = function(options) {
		// For each element passed in the jQuery object
		return this.each(function() {
			var $this = $(this);

			var carousel = new Carousel(this, options);

			// Allow you to call some methods via trigger callback
			/* 
			$('.carousel').trigger('carouselssinstance', function(carousel) {
				carousel.next();
			});
			*/
			triggerBind($this, carousel, pluginName + 'instance', function(cb) {
				cb(carousel);
			});
		});

		function triggerBind($element, pluginInstance, eventName, method) {
			$element.bind(eventName, function() {
				method.apply(pluginInstance, Array.prototype.slice.call(arguments, 1));
			});
		}
	};

	$.fn[pluginName]['defaults'] = defaults;





	// A better modulo function that works the way you expect
	function mod(x, m) {
		return (x%m + m)%m;
	}


	// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
	Object.keys = Object.keys || (function() {
		'use strict';
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
			dontEnums = [
				'toString',
				'toLocaleString',
				'valueOf',
				'hasOwnProperty',
				'isPrototypeOf',
				'propertyIsEnumerable',
				'constructor'
			],
			dontEnumsLength = dontEnums.length;
		
		return function(obj) {
			if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
				throw new TypeError('Object.keys called on non-object');
			}
			
			var result = [], prop, i;
			
			for (prop in obj) {
				if (hasOwnProperty.call(obj, prop)) {
					result.push(prop);
				}
			}
			
			if (hasDontEnumBug) {
				for (i = 0; i < dontEnumsLength; i++) {
					if (hasOwnProperty.call(obj, dontEnums[i])) {
						result.push(dontEnums[i]);
					}
				}
			}
			return result;
		};
	}());


	// Pass in a element, and a callback that will be called to see if any properties on the elment have changed
	// Then we compare the properties that have changed to the properties that are going to transition
	//
	// Unit Tests: http://jsfiddle.net/MadLittleMods/vhr9qxqh/
	function getMaxTransitionDurationFromChange(element, changeFunc)
	{
		var durationInfo = getDurationInfo(element.css('transition-property'), element.css('transition-duration'), element.css('transition-delay'));
		// If there is a duration greater than zero then there is something to transition possibly
		if(durationInfo) {
			// Get a before and after snapshot
			var beforeDeprecatedCSS = css(element);
			changeFunc();
			var afterDeprecatedCSS = css(element);
			
			// Get the properties that will transition on this element
			var transitionProperties = (element.css('transition-property') || '').split(/,\s*/);
			
			var currentValidatedLongestDuration = false;
			
			// Check to see if any of the properties that changed are in list of properties that will transition
			for(var j = 0; j < transitionProperties.length; j++) {
				var property = transitionProperties[j];
				
				var hasSomethingChanged = false;
				if(property == 'all') {
					// Loop through all of the properties and find one that has changed
					var propertyKeys = Object.keys(beforeDeprecatedCSS);
					for(var propIndex = 0; propIndex < propertyKeys.length; propIndex++) {
						var key = propertyKeys[propIndex];
						if(beforeDeprecatedCSS[key] != afterDeprecatedCSS[key]) {
							hasSomethingChanged = true;
							break;
						}
					}
				}
				else {
					// Use jquery to find if different because it could be shorthand etc
					hasSomethingChanged = $('<div></div>').css(beforeDeprecatedCSS).css(property) != $('<div></div>').css(afterDeprecatedCSS).css(property);
				}
				
				// If the before-after values are different
				if(hasSomethingChanged) {
					var duration = durationInfo.map[property];
					if(duration > currentValidatedLongestDuration) {
						currentValidatedLongestDuration = duration;
					}
					//break;
				}
			}
			
			return currentValidatedLongestDuration;
		}
		
		// They are still expecting the change, so we still need to run it but we don't have to do anything special
		changeFunc();
		return false;
	}


	// Returns the maximum animation duration affecting a element
	// We check for multiple animations and whether the keyframe declarations exist
	//
	// Unit Tests: http://jsfiddle.net/MadLittleMods/ag2y7654/
	function getMaxAnimationDuration(element) {
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


	// Parameters:
	// `nameString`: `$element.css('animation-name')` or `$element.css('transition-name')`
	// `durationString`: `$element.css('animation-duration')` or `$element.css('transition-duration')`
	// Will return object containing the `maxKey` and `map` of duration to name
	function getDurationInfo(nameString, durationString, /*optional*/delayString) {
		var durationMap = {};
		var maxDurationKey = false;
		var maxDurationValue = false;
		
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
				if(durationValue != null && durationValue > 0) {
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

	// Converts CSS time value string(ex. 1s or 10ms) to a number in seconds
	function cssTimeValueToSeconds(cssTimeValue) {
		var matches = (cssTimeValue || '').match(/(\d*?\.?\d*?)(s|ms)/i);
		var timeValue = parseFloat(matches[1], 10) * (matches[2] == "ms" ? 0.001 : 1);
		
		return timeValue;
	}


	// Returns any defined CSS keyframes in the document
	function getCSSKeyframeList() {
		var keyframeList = {};

		for(var stylesheetIndex = 0; stylesheetIndex < document.styleSheets.length; stylesheetIndex++) {
			var stylesheet = document.styleSheets[stylesheetIndex];

			var rules = stylesheet.cssRules || stylesheet.rules;
			if(rules) {
				for(var i = 0; i < rules.length; i++) {
					var rule = rules[i];

					// Make sure it is the right type of rule
					var CSSKeyframesRule = window.CSSKeyframesRule || false;
					if(CSSKeyframesRule && rule instanceof CSSKeyframesRule) {
						//console.log('found:', rule.name);
						keyframeList[rule.name] = true;
					}
				}
			}
		}

		return keyframeList;
	}


	// Get all CSS styles associated with an element
	// via: http://stackoverflow.com/a/5830517/796832
	function css(a) {
		var sheets = document.styleSheets;
		var o = {};
		for (var i in sheets) {
			var rules = sheets[i].rules || sheets[i].cssRules;
			for (var r in rules) {
				try {
					if (a.is(rules[r].selectorText)) {
						o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
					}
				}
				catch(e) {
					// Do nothing because it that property was unsupported and through a sizzle error
				}
			}
		}
		return o;
	}
	function css2json(css) {
		var s = {};
		if (!css) return s;
		var CSSStyleDeclaration = window.CSSStyleDeclaration || false;
		if (CSSStyleDeclaration && css instanceof CSSStyleDeclaration) {
			for (var i = 0; i < css.length; i++) {
				if ((css[i]).toLowerCase) {
					s[(css[i]).toLowerCase()] = (css[css[i]]);
				}
			}
		} else if (typeof css == "string") {
			css = css.split("; ");
			for (var i in css) {
				var l = css[i].split(": ");
				s[l[0].toLowerCase()] = (l[1]);
			}
		}
		return s;
	}





	// Require modules that return functions get called, so defer a bit
	return function() {
		return Carousel;
	};

}));