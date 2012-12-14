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
		    // Handle the 3 simple types, and null or undefined
		    if (null === obj || "object" != typeof obj) return obj;
		    
		    // Handle Date
		    if (obj instanceof Date) {
		        var copy = new Date();
		        copy.setTime(obj.getTime());
		        return copy;
		    }
		
		    // Handle Array
		    if (obj instanceof Array) {
		        var copy = [], len, i;
		        for (i = 0, len = obj.length; i < len; ++i) {
		            copy[i] = _util.cloneObject(obj[i]);
		        }
		        return copy;
		    }
		
		    // Handle Object
		    if (obj instanceof Object) {
		        var copy = {}, attr;
		        for (attr in obj) {
		            if (obj.hasOwnProperty(attr)) copy[attr] = _util.cloneObject(obj[attr]);
		        }
		        return copy;
		    }
		
		    //throw new Error("Unable to copy obj! Its type isn't supported.");
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
			if (e && e.preventDefault) {
				e.preventDefault();
			}
			return false;
		};
		
		_util.preventBubble = function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation();
			}
			window.event.cancelBubble = true; //IE cancel bubble;
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
			var method, time, connector, responseData, ajaxRequest;
			
			if (!URL || !method) return false;
			
		   	if(ajaxRequest = getXmlHttpRequestObject()) {
			    	method = method.toUpperCase();
					time = +new Date,connector;
					if(URL.indexOf('?') != -1) {
					URL.indexOf('?') == URL.length-1 ? connector = "" : connector = "&";
				}
				else {
					connector = "?";
				}
				(method === "GET") ? ajaxRequest.open(method, URL+connector+time+"&IsAjaxRequest=true&ajax=true&"+params, true) : ajaxRequest.open(method, URL+connector+time+"&IsAjaxRequest=true&ajax=true", true)
				ajaxRequest.onreadystatechange = function () {
					if(ajaxRequest.readyState == 4) {
						if(ajaxRequest.status == "200") {
							responseData = dataType == "xml" ? ajaxRequest.responseXML : ajaxRequest.responseText;
							if(sHandle != null){sHandle(true, responseData);}
							return true;
						}
						else{
							if(sHandle != null){sHandle(false, responseData);}
							return false;
						}
					}
				}
				ajaxRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				//ajaxRequest.setRequestHeader("Content-length", params.length);
				//ajaxRequest.setRequestHeader("Connection", "close");
				(params != null && method === "POST") ? ajaxRequest.send(params) : ajaxRequest.send();
			}
			else {
				return false;
			}
			
			/* Utility function used by ajax function */
			function getXmlHttpRequestObject() {
				if(window.XMLHttpRequest && (window.location.protocol !== "file:" || !window.ActiveXObject)) {
					return new window.XMLHttpRequest();
				}
				else {
					try {
						return new window.ActiveXObject("Microsoft.XMLHTTP");
					}
					catch(e) {
						try {
							return new window.ActiveXObject("MSXML2.XMLHTTP");
						}
						catch(e) {return false;}
					}
				}
			}
		};
		
		_util.detectEngines = function() {

		    //rendering engines
		    var engine = {ie: 0, gecko: 0, webkit: 0, khtml: 0, opera: 0, ver: null};
		
		    //detect rendering engines/browsers
		    var ua = navigator.userAgent;    
		    if (window.opera){
		        engine.ver = window.opera.version();
		        engine.opera = parseFloat(engine.ver);
		    } else if (/AppleWebKit\/(\S+)/.test(ua)){
		        engine.ver = RegExp["$1"];
		        engine.webkit = parseFloat(engine.ver);
		    } else if (/KHTML\/(\S+)/.test(ua) || /Konqueror\/([^;]+)/.test(ua)){
		        engine.ver = RegExp["$1"];
		        engine.khtml = parseFloat(engine.ver);
		    } else if (/rv:([^\)]+)\) Gecko\/\d{8}/.test(ua)){    
		        engine.ver = RegExp["$1"];
		        engine.gecko = parseFloat(engine.ver);
		    } else if (/MSIE ([^;]+)/.test(ua)){
		        engine.ver = RegExp["$1"];
		        engine.ie = parseFloat(engine.ver);
		    }
		
		    //return it
		    return engine;
		
		};
		
		window.ghostedit.util = _util;
})(window);