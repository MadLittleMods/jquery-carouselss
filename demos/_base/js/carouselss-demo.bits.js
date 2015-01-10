$(document).ready(function() {
	$('head').append('<link href="../_base/carouselss-demo-page-styles.css" type="text/css" rel="stylesheet">');

	$.get("../_base/carouselss-code-section.html", function(html) {
		// Append the code section markup to the page
		$(html).appendTo('body');

		// Fill the code section
		// Copy the code for the demos into nice viewable boxes
		$('.carouselss-demo-script-code-box').text(unindentHtml($('.carouselss-demo-script').html()).trim());
		$('.carouselss-demo-style-code-box').text(unindentHtml($('.carouselss-demo-styles').html()).trim());
		$('.carouselss-demo-markup-code-box').text(unindentHtml($('.carouselss-demo-markup').html()).trim());
	});


	// via: https://github.com/sindresorhus/strip-indent
	function unindentHtml(str) {
		var match = str.match(/^[ \t]*(?=\S)/gm);

		if (!match) {
			return str;
		}

		var indent = Math.min.apply(Math, match.map(function (el) {
			return el.length;
		}));

		var re = new RegExp('^[ \\t]{' + indent + '}', 'gm');

		return indent > 0 ? str.replace(re, '') : str;
	}
});