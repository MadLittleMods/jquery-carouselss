# CarouselSS

CarouselSS, pronounced "carousel s-s", is jQuery Carousel plugin for HTML content/images. It listens to CSS transition/animation events when switching frames so you don't have to arbitrarly define a duration in the option passed into the plugin declaration. CarouselSS uses CSS class-based states.

# Usage

The only dependency is [jQuery](https://jquery.com/).

```
<script src="jquery-1.11.1.js"></script>
<script src="jquery-carouselss.js"></script>

<script>
	$(document).ready(function() {
		$('.carousel').carouselss();
	});
</script>
```


# Demos

Title | Preview
----- | ----
[Barebones demo](https://madlittlemods.github.io/jquery-carouselss/demos/barebones-demo/) | ![](https://raw.githubusercontent.com/MadLittleMods/jquery-carouselss/master/demos/barebones-demo/preview.gif)
[Custom Thumbnail demo](https://madlittlemods.github.io/jquery-carouselss/demos/custom-thumbnail-demo/) | ![](https://raw.githubusercontent.com/MadLittleMods/jquery-carouselss/master/demos/custom-thumbnail-demo/preview.gif)
[Overlay demo](https://madlittlemods.github.io/jquery-carouselss/demos/overlay-demo/) | ![](https://raw.githubusercontent.com/MadLittleMods/jquery-carouselss/master/demos/overlay-demo/preview.gif)
[Next/Prev Controls demo](https://madlittlemods.github.io/jquery-carouselss/demos/next-prev-controls-demo/) | ![](https://raw.githubusercontent.com/MadLittleMods/jquery-carouselss/master/demos/next-prev-controls-demo/preview.gif)
[Frame switch fade transition demo](https://madlittlemods.github.io/jquery-carouselss/demos/frame-switch-fade-transition-demo/) | ![](https://raw.githubusercontent.com/MadLittleMods/jquery-carouselss/master/demos/frame-switch-fade-transition-demo/preview.gif)



# Explanation & CSS States

The content for each frame lives inside the thumbnail. If you dont't want that content showing up just add `display: none;`.

```
.carousel-thumbnail .my-special-content
{
	display: none;
}
```

Every frame move(whether it be auto-advance, next, manual move), the old frame gets a `.is-deprecated` class and is removed/deleted after any transition/animation is completed. If no transition/animation is present, then the frame is deleted immediately.

Since the contents are copied inside a `.carousel-frame` container, the `.carousel-thumbnail` rules, where you might of hid content, no longer apply and the frame is displayed.



## Typical HTML Markup

```
<div class="carousel">
	<div class="carousel-stage"></div>

	<ul class="carousel-thumbnail-holder">
		<li role="button" tabindex="0" class="carousel-thumbnail">
			<img src="../_base/images/mountains.png" alt="Mountains">
		</li>
		<li role="button" tabindex="0" class="carousel-thumbnail">
			<img src="../_base/images/lorem.png" alt="Lorem">
		</li>
		<li role="button" tabindex="0" class="carousel-thumbnail">
			<img src="../_base/images/creek.png" alt="Creek">
		</li>
	</ul>
</div>
```




# Options

```
$('.carousel').carouselss({ /* options */ });
```

 - `options`: object - hash of options
 	 - `interval`: number - Time between the auto-advance goes to the next frame (in ms, 3000 = 3 seconds)
 	 	 - Default: 3000
 	 	 - A negative value disables the auto-advance
 	 - `startIndex`: number - Which frame (zero-indexed) of the thumbnail list we should start at.
 	 	 - Default: 0
 	 	 - This will be clamped to the available thumbnail indexes
 	 - `thumbnail`: string - Selector used to find the thumbnails within the root carousel element
 	 	- Default: '.carousel-thumbnail'
 	 - `stage`: string - Selector used to find the stage to put each frame as they cycle
 	 	 - Default: '.carousel-stage'
 	 - `stageFrameClass`: The class added to the wrapper "frame" element that contains the frame contents
 	 - `move`: event function callback - Gets executed every time the carousel moves to another frame
 	 	 - Default: null
 	 	 - The move event can also be bound after plugin intialization using `$('.carousel').bind('carouselssmove', function() { });`


# Methods

You can access CarouselSS's methods by passing a callback into a `carouselssinstance` trigger. The callback will be passed the instance of the CarouselSS plugin.

```
$('.carousel').trigger('carouselssinstance', function(carousel) {
	// See method list available, below
	carousel.move(2);
	carousel.next(); // etc...
});
```

 - `next()`: Moves to the next frame in the list (by index)
 - `prev()`: Moves to the previous frame in the list (by index)
 - `move(index)`: Moves to the given frame (by index)
 - `startInterval()`: Start the auto-advance interval frame cycling
 - `stopInterval()`: Stop the auto-advance interval frame cycling
