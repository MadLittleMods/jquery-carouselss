// CarouselSS = CSS (clever, maybe)
// Because we use and listen to CSS transitions/animations for frame switching and use class-based states
// By: Eric Eastwood
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

	// A better modulo function that works the way you expect
	function mod(x, m) {
		return (x%m + m)%m;
	}

	// via: http://stackoverflow.com/a/5830517/796832
	function css(a)
	{
		var sheets = document.styleSheets, o = {};
		for (var i in sheets) {
			var rules = sheets[i].rules || sheets[i].cssRules;
			for (var r in rules) {
				if (a.is(rules[r].selectorText)) {
					o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
				}
			}
		}
		return o;
	}
	function css2json(css)
	{
		var s = {};
		if (!css) return s;
		if (css instanceof CSSStyleDeclaration) {
			for (var i in css) {
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


	function getCSSKeyframeList()
	{
		// Returns any defined CSS keyframes in the document
		var keyframeList = {};

		for(var stylesheetIndex = 0; stylesheetIndex < document.styleSheets.length; stylesheetIndex++) {
			var stylesheet = document.styleSheets[stylesheetIndex];

			var rules = stylesheet.cssRules || stylesheet.rules;
			if(rules) {
				for(var i = 0; i < rules.length; i++) {
					var rule = rules[i];

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

	function hasTransitionFromChange(element, changeFunc)
	{
		var maxTransitionDuration = false;

		var durationString = element.css('transition-duration');
		if(durationString) {
			var durations = durationString.split(/,\s*/);
			var hasTransitionDuration = false;
			for(var i = 0; i < durations.length; i++) {
				var durationString = durations[i];
				durationString = durationString || "";
				var durationStringMatches = durationString.match(/(\d*?\.?\d*?)(s|ms)/i);
				var duration = parseFloat(durationStringMatches[1], 10) * (durationStringMatches[2] == "ms" ? 0.001 : 1);

				if(duration != null && duration > 0) {
					hasTransitionDuration = true;
				}
				if(duration > maxTransitionDuration) {
					maxTransitionDuration = duration;
				}
			}
		}


		// If there is a duration greater than zero then there is something to transition possibly
		if(hasTransitionDuration) {
			// Get a before and after snapshot
			var beforeDeprecatedCSS = css(element);
			changeFunc();
			var afterDeprecatedCSS = css(element);

			var transitionProperties = element.css('transition-property').split(/,\s*/);

			for(var j = 0; j < transitionProperties.length; j++) {
				var property = transitionProperties[j];

				if(beforeDeprecatedCSS[property] != afterDeprecatedCSS[property]) {
					return maxTransitionDuration;
					//break;
				}
			}
		}
		else {
			// They are still expecting the change, but we don't have to do anything
			changeFunc();
			return false;
		}
		
	}


	function hasAnimation(element)
	{
		var nameString = element.css('animation-name');
		var durationStringMatches = element.css('animation-duration') || "";
		var duration = parseFloat(durationStringMatches[1], 10) * (durationStringMatches[2] == "ms" ? 0.001 : 1);

		if(nameString && nameString != 'none') {
			// We use this to make sure the keyframes exist
			var cssKeyframeList = getCSSKeyframeList();

			var names = nameString.split(/,\s*/);
			for(var i = 0; i < names.length; i++)
			{
				var name = names[i];

				var doKeyframesExist = !!cssKeyframeList[name];

				if(doKeyframesExist)
				{
					return duration;
				}
			}
		}

		return false;
	}



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
					var frameTransitionTime = hasTransitionFromChange(frame, function() {
						frame.addClass('is-deprecated');
					});
					// Check animation after the deprecated class is added from the check for transition above
					var frameAnimationTime = hasAnimation(frame);

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


	// Require modules that return functions get called, so defer a bit
	return function() {
		return Carousel;
	};

}));