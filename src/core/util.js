(function (window, undefined) {
		
		var _util = {};
		
		_util.trim = function (string) {
			return string.replace(/^\s+/, "").replace(/\s+$/, "");
		};
		
		// This will call a function using a reference with predefined arguments.
		//SECOND ARGUMENT = CONTEXT (this) - should usually be false
		_util.preparefunction = function (func, context /*, 0..n args */) {
			var args = Array.prototype.slice.call(arguments, 2);
			return function() {
				var allArguments = args.concat(Array.prototype.slice.call(arguments));
				return func.apply(context ? context : this, allArguments);
			};
		};
		
		_util.isFunction = function (variable) {
			if (!variable) return false;
			if (typeof variable !== "function") return false;
			return true;
		};
		
		_util.cloneObject = function (obj) {
			var copy, len, i, attr;
			// Handle the 3 simple types, and null or undefined
			if (null === obj || "object" !== typeof obj) return obj;
			
			// Handle Date
			if (obj instanceof Date) {
				copy = new Date();
				copy.setTime(obj.getTime());
				return copy;
			}
			
			// Handle Array
			if (obj instanceof Array) {
				copy = [];
				for (i = 0, len = obj.length; i < len; ++i) {
					copy[i] = _util.cloneObject(obj[i]);
				}
				return copy;
			}
			
			// Handle Object
			if (obj instanceof Object) {
				copy = {};
				for (attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = _util.cloneObject(obj[attr]);
				}
				return copy;
			}
		};
		
		_util.addClass = function (elem, c) {
			elem.className = _util.trim(elem.className) + " " + c;
		};
		
		_util.removeClass = function (elem, c) {
			var r = new RegExp(c,"g");
			elem.className = _util.trim(elem.className.replace(r, ""));
		};
		
		_util.cancelEvent = function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation(); // DOM style (return false doesn't always work in FF)
				e.preventDefault();
			}
			else if (e) {
				e.returnValue = false;
			}
			return false; // false = IE style
		};
		
		_util.cancelAllEvents = function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation(); // DOM style (return false doesn't always work in FF)
				e.preventDefault();
			}
			else if (window.event) {
				window.event.cancelBubble = true; //IE cancel bubble;
			}
			return false; // false = IE style
		};
		
		_util.preventDefault = function (e) {
			// Standards based browsers
			if (e && e.preventDefault) {
				e.preventDefault();
			}
			// ie <= 8
			return false;
		};
		
		_util.preventBubble = function (e) {
			// Standards based browsers
			if (e && e.stopPropagation) {
				e.stopPropagation();
			}
			// ie <= 8
			if (window.event) window.event.cancelBubble = true;
		};
		
		_util.addEvent = function (elem, eventType, handle) {
			if (elem.addEventListener !== undefined) {
				elem.addEventListener(eventType, handle, false);
			}
			else {
				elem.attachEvent("on" + eventType, handle);
			}
		};
		
		_util.removeEvent = function (elem, eventType, handle) {
			if (elem.removeEventListener !== undefined) {
				elem.removeEventListener(eventType, handle, false);
			}
			else {
				elem.detachEvent("on" + eventType, handle);
			}
		};
		
		_util.ajax = function (URL, method, params, sHandle, dataType) {
			var time, connector, xhr;
			
			if (!URL || !method) return false;
			
			// Get XHR object
			xhr = false;
			if(window.XMLHttpRequest && (window.location.protocol !== "file:" || !window.ActiveXObject)) {
				xhr = new window.XMLHttpRequest();
			}
			else {
				try { xhr = new window.ActiveXObject("Microsoft.XMLHTTP"); }
				catch (e) { try { xhr = new window.ActiveXObject("MSXML2.XMLHTTP"); } catch (e2) {} }
			}
			if (!xhr) return false;
			
			// Prepare variables
			method = method.toUpperCase();
			time = new Date().getTime();
			URL = URL.replace(/(\?)+$/, "");
			connector = (URL.indexOf('?') === -1) ? "?" : "&";
			//connector = (URL.indexOf('?') === URL.length - 1) ? "" : "&";

			// Open ajax Request
			if (method === "GET") {
				xhr.open(method, URL + connector + time + "&" + params, true);
			}
			else {
				xhr.open(method, URL + connector + time, true);
			}
			
			// Define function to handle response
			xhr.onreadystatechange = function () {
				var responseData;
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
						responseData = (dataType === "xml") ? xhr.responseXML : xhr.responseText;
						if (sHandle !== null){ sHandle(true, responseData); }
						return true;
					}
					else{
						if (sHandle !== null){ sHandle(false, responseData); }
						return false;
					}
				}
			};
			
			// Set HTTP headers
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			//xhr.setRequestHeader("Content-length", params.length);
			//xhr.setRequestHeader("Connection", "close");
			
			// Send ajax request
			if (method === "POST" && params !== null) {
				xhr.send(params);
			}
			else {
				xhr.send();
			}
		};
		
		_util.detectEngines = function() {
		
			//rendering engines
			var engine = {ie: 0, gecko: 0, webkit: 0, khtml: 0, opera: 0, ver: null};
			
			// Detect rendering engines/browsers
			var ua = navigator.userAgent;
			if (window.opera){
				engine.ver = window.opera.version();
				engine.opera = parseFloat(engine.ver);
			} else if (/AppleWebKit\/(\S+)/.test(ua)){
				engine.ver = RegExp.$1;
				engine.webkit = parseFloat(engine.ver);
			} else if (/KHTML\/(\S+)/.test(ua) || /Konqueror\/([^;]+)/.test(ua)){
				engine.ver = RegExp.$1;
				engine.khtml = parseFloat(engine.ver);
			} else if (/rv:([^\)]+)\) Gecko\/\d{8}/.test(ua)){
				engine.ver = RegExp.$1;
				engine.gecko = parseFloat(engine.ver);
			} else if (/MSIE ([^;]+)/.test(ua)){
				engine.ver = RegExp.$1;
				engine.ie = parseFloat(engine.ver);
			}
			
			//return it
			return engine;
		
		};
		
		window.ghostedit.util = _util;
})(window);