(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals (root is window)
		root.css = factory(root.$);
	}
}(this, function($) {

	"use strict";

	// Get all CSS styles associated with an element
	// via: http://stackoverflow.com/a/5830517/796832
	function css(element) {
		var sheets = document.styleSheets,
			associatedStyles = {};

		for(var i in sheets) {

			var rules = [];
			try {
				rules = sheets[i].rules || sheets[i].cssRules;
			}
			catch(err) {
				console.log('CarouselSS: unable to read styles', err);
			}

			for(var r in rules) {
				try {
					if (element.is(rules[r].selectorText)) {
						associatedStyles = $.extend(associatedStyles, css2json(rules[r].style), css2json(element.attr('style')));
					}
				}
				catch(e) {
					// Do nothing because it that property was unsupported and threw a sizzle error (mostly happens in old IE's)
				}
			}
		}

		return associatedStyles;
	}
	function css2json(css) {
		var s = {},
			CSSStyleDeclaration = window.CSSStyleDeclaration || false;

		if(css) {
			if (CSSStyleDeclaration && css instanceof CSSStyleDeclaration) {
				for (var i = 0; i < css.length; i++) {
					if ((css[i]).toLowerCase) {
						s[(css[i]).toLowerCase()] = (css[css[i]]);
					}
				}
			} else if(typeof css === "string") {
				var declarations = css.split(/;\s?/);
				for (var declaration in declarations) {
					var l = css[declaration].split(/:\s?/);
					s[l[0].toLowerCase()] = (l[1]);
				}
			}
		}

		return s;
	}


	return css;

}));
