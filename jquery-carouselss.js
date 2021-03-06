// CarouselSS
// A jQuery Carousel plugin. It listens to CSS transition/animation events when switching frames and uses CSS class-based states.
//
// https://github.com/MadLittleMods/jquery-carouselss
//
// By: Eric Eastwood - EricEastwood.com
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './lib/mod', './lib/get-max-animation-duration', './lib/get-max-transition-duration-from-change'], function($) {
			return factory($);
		});
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'), require('./lib/mod'), require('./lib/get-max-animation-duration'), require('./lib/get-max-transition-duration-from-change'));
	} else {
		// Browser globals (root is window)
		// Make sure jQuery is set to atleast something
		var $ = root.$ || root.jQuery || {};
		$.carouselss = factory($, root.mod, root.getMaxAnimationDuration, root.getMaxTransitionDurationFromChange);
	}
}(this, function($, mod, getMaxAnimationDuration, getMaxTransitionDurationFromChange) {

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

		var frameDelayCache = {};


		// Helper binding function to allow for easy bind(init) and unbind(destroy)
		var currentBindings = [];
		function bind(element, selector, cb) {
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
		}

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
				if(e.type === 'click' || (e.type === 'keydown' && (e.keyCode === 32 || e.keyCode === 13))) {
					// Move to the selected position
					self.move($(this).index());

					// Restart the interval so we get adequate time on the new frame
					self.startInterval();

					e.preventDefault();
				}
			});

			// Reset the map
			// Something may have changed in the styles so we better look it up again.
			frameDelayCache = {};
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

		// Start the auto-advance cycling
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

		// Stop the auto-advance cycling
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
				// This ensures that the current frame is above the new frame(by the nature of document flow) so the current frame can "fade out"
				// Also the frames will be behind any separate overlays in the stage if prepended
				currentFrame = newFrameContents.prependTo($carouselStage);

				// Update the carousel position
				this.currentPosition = index;

				// Trigger the `move` callback
				if(this.opts.move) {
					this.opts.move(jQuery.Event('move'));
				}
				// Fire the qualified `move` event
				$carouselElement.trigger(pluginName + 'move', jQuery.Event('move'));
			}
		};

		this.removeFrame = function(frame, frameIndex) {
			if(frame) {
				//console.log('frametodel:', frame.attr('data-position'));

				// Look it up in the cache/map
				var maxTransitionOrAnimationTime = frameDelayCache[frameIndex];
				// If it wasn't in the cache, add a value for this index
				if(!maxTransitionOrAnimationTime) {
					var frameTransitionTime = getMaxTransitionDurationFromChange(frame, function() {
						frame.addClass('is-deprecated');
					});
					// Check animation AFTER the deprecated class is added from the check for transition above
					// This will ensure that any new animation from the class being added is ready
					var frameAnimationTime = getMaxAnimationDuration(frame);

					// Cache it in the map
					frameDelayCache[frameIndex] = frameAnimationTime > frameTransitionTime ? frameAnimationTime : frameTransitionTime;
					// Update our running variable
					maxTransitionOrAnimationTime = frameDelayCache[frameIndex];
				}
				else {
					// The `is-deprecated` class is added in both the if and else.
					// But we need to add it separatly because in order to get the transition time to put in the cache.
					// We need to capture the styles before it is added, and then after. see `getMaxTransitionDurationFromChange`
					frame.addClass('is-deprecated');
				}

				// Helper function so we only remove the frame once
				var isCurrentFrameRemoved = false;
				var removeCurrentFrame = function() {
					if(!isCurrentFrameRemoved) {
						frame.remove();
					}
					isCurrentFrameRemoved = true;
				};

				// If there is not animaiton/transition time, delete it right away
				if(!maxTransitionOrAnimationTime) {
					removeCurrentFrame();
				}
				// Otherwise, wait for the animation/transition to finish, then delete it
				else {
					frame.one(animationEndEventString + ' ' + transitionEndEventString, function() {
						removeCurrentFrame();
					});
					// This is a safety-net in case the animation/transition event never fires
					// Note: The animation/transition events won't fire when you tab away and the frames keep on moving
					setTimeout(function() {
						removeCurrentFrame();
					}, (maxTransitionOrAnimationTime + 0.017)*1000); // We add a 60hz(0.017) frame time to make up for waiting for the normal event firing which usually happens on requesetAnimationFrame 60fps/hz
				}
			}
		};


		// In case they call this plugin multiple times on the same element, clean up the prior instantiation
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

			// Allows you to call some methods via trigger callback
			/*
			$('.carousel').trigger('carouselssinstance', function(carousel) {
				// Any internal carousel method is available here
				carousel.next();
			});
			*/
			triggerBind($this, carousel, pluginName + 'instance', function(cb) {
				cb(carousel);
			});
		});

		// Helper method to help bind the plugin instance with a certain context.
		function triggerBind($element, pluginInstance, eventName, method) {
			$element.bind(eventName, function() {
				method.apply(pluginInstance, Array.prototype.slice.call(arguments, 1));
			});
		}
	};

	// Other plugins store these for reference
	// So we might as well do it too
	$.fn[pluginName].defaults = defaults;





	return Carousel;


}));
