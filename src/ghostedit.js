/* GhostEdit WYSIWYG editor version 1.0-beta2
Copyright (C) 2010-2012 Nico Burns

Name:				GhostEdit
Description:			Usability focused rich text editor
Licence:				Dual licensed under MIT and LGPL licenses.
Browser Support:		Internet Explorer 6+, Mozilla Firefox 3.6+, Google Chrome, Apple Safari 3+, Opera 10.50+
Author:				Nico Burns <http://nicoburns.com>
Website:				http://ghosted.it
Version:				1.0-beta2
Release Date:			29th June 2012

Major changes:
Further modularisation (enter, import, export)
IE fixes (it now mostly works)

Todo:
Select all deleteSelectionContents case
*/


var ghostedit = {
	/* Global Variables */
	active: false,
	isEditing: true,
	blockElemId: 0,
	editorchrome: null,
	debug: false,

	/* Tags which GhostEdit can handle (plugins can add to these lists) */
	allowedinlinetags: ["b", "i", "u", "strong", "em", "strike", "br", "a"],
	allowedtags: ["b", "i", "u", "strong", "em", "strike", "br", "a", "h1", "h2", "h3", "h4", "h5", "h6", "p"],//pasting doesn't handle images yet, "img"],

	/* Regular expressions used in GhostEdit */
	wordendregex: /\s|[\!\?\.\,\:\;\"]/,
	
	util: {
	
		/*nl2br: function (text) {
			var re_nlchar = undefined;
			
			text = escape(text);
			if (text.indexOf('%0D%0A') > -1) {
				re_nlchar = /%0D%0A/g;
			} else if (text.indexOf('%0A') > -1) {
				re_nlchar = /%0A/g;
			} else if (text.indexOf('%0D') > -1) {
				re_nlchar = /%0D/g;
			}
			
			return typeof(re_nlchar) == "undefined" ? unescape( text ) : unescape( text.replace(re_nlchar,'') );
			//return unescape( text.replace(re_nlchar,'<br />') );
		},*/
		
		trim: function (string) {
			return string.replace(/^\s+/, "").replace(/\s+$/, "");
		},
		
		//The following function 'strip_tags' is licensed under the MIT licence from http://phpjs.org/functions/strip_tags
		strip_tags: function (str, allowed_tags) {
			// Strips HTML and PHP tags from a string  
			// 
			// version: 1008.1718
			// discuss at: http://phpjs.org/functions/strip_tags
			// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +   improved by: Luke Godfrey
			// +      input by: Pul
			// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +   bugfixed by: Onno Marsman
			// +      input by: Alex
			// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +      input by: Marc Palau
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +      input by: Brett Zamir (http://brett-zamir.me)
			// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +   bugfixed by: Eric Nagel
			// +      input by: Bobby Drake
			// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +   bugfixed by: Tomasz Wesolowski
			// *     example 1: strip_tags('<p>Kevin</p> <b>van</b> <i>Zonneveld</i>', '<i><b>');
			// *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
			// *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
			// *     returns 2: '<p>Kevin van Zonneveld</p>'
			// *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
			// *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
			// *     example 4: strip_tags('1 < 5 5 > 1');
			// *     returns 4: '1 < 5 5 > 1'
			var key = '', allowed = false, matches = [], allowed_array = [], allowed_tag = '', i = 0, k = '', html = '', replacer;
		 
			replacer = function (search, replace, str) {
				return str.split(search).join(replace);
			};
		 
			// Build allowes tags associative array
			if (allowed_tags) {
				allowed_array = allowed_tags.match(/([a-zA-Z0-9]+)/gi);
			}
		 
			str += '';
		 
			// Match tags
			matches = str.match(/(<\/?[\S][^>]*>)/gi);
		 
			// Go through all HTML tags
			for (key in matches) {
				if (isNaN(key)) {
					// IE7 Hack
					continue;
				}
		 
				// Save HTML tag
				html = matches[key].toString();
		 
				// Is tag not in allowed list? Remove from str!
				allowed = false;
		 
				// Go through all allowed tags
				for (k in allowed_array) {
					// Init
					allowed_tag = allowed_array[k];
					i = -1;
		 
					if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+'>');}
					if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+' ');}
					if (i != 0) { i = html.toLowerCase().indexOf('</'+allowed_tag)   ;}
		 
					// Determine
					if (i == 0) {
						allowed = true;
						break;
					}
				}
		 
				if (!allowed) {
					str = replacer(html, "", str); // Custom replace. No regexing
				}
			}
		 
			return str;
		},
		
		tagmatchexperiment: function () {
			var testhtml, rmatchtag;
			testhtml = "<fauishf></fauishf><><e id='testhtm>l'>";
			rmatchtag = /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/;
			rmatchtag = /<((?:".*?"|'.*?'|[^'">\s]+))?>/ig;
			
			//alert( testhtml.match(rmatchtag) );
			
		},
		
		// This will call a function using a reference with predefined arguments.
		preparefunction: function (func, context /*, 0..n args */) {
			var args = Array.prototype.slice.call(arguments, 2);
			return function() {
				var allArguments = args.concat(Array.prototype.slice.call(arguments));
				return func.apply(context ? context : this, allArguments);
			};
		},
		
		extractContent: function (node) {
			var frag = document.createDocumentFragment(), child;
			while ( (child = node.firstChild) ) {
				frag.appendChild(child);
			}
			return frag;
		},
		
		addClass: function (elem, c) {
			elem.className = ghostedit.util.trim(elem.className) + " " + c;
		},
		
		removeClass: function (elem, c) {
			var r = new RegExp(c,"g");
			elem.className = ghostedit.util.trim(elem.className.replace(r, ""));
		},
		
		cancelEvent: function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation(); // DOM style (return false doesn't always work in FF)
				e.preventDefault();
			}
			else if (e) {
				e.returnValue = false;
			}
			return false; // false = IE style
		},
		
		cancelAllEvents: function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation(); // DOM style (return false doesn't always work in FF)
				e.preventDefault();
			}
			else if (window.event) {
				window.event.cancelBubble = true; //IE cancel bubble;
			}
			return false; // false = IE style
		},
		
		preventDefault: function (e) {
			if (e && e.preventDefault) {
				e.preventDefault();
			}
			return false;
		},
		
		preventBubble: function (e) {
			if (e && e.preventDefault) {
				e.stopPropagation();
			}
			//else {
				window.event.cancelBubble = true; //IE cancel bubble;
			//}
		},
		
		addEvent: function (elem, eventType, handle) {
			if (elem.addEventListener !== undefined) {
				elem.addEventListener(eventType, handle, false);
			}
			else {
				elem.attachEvent("on" + eventType, handle);
			}
		},
		
		ajax: function (URL, method, params, sHandle, dataType) {
			
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
			
			var method, time, connector, responseData, ajaxRequest;
			
		    if(ajaxRequest = getXmlHttpRequestObject()) {
		    	method = method.toUpperCase();
				time = +new Date,connector;
				if(URL.indexOf('?') != -1) {
					URL.indexOf('?') == URL.length-1 ? connector = "" : connector = "&";
				}
				else {
					connector = "?";
				}
				method == "GET" ? ajaxRequest.open(method, URL+connector+time+"&IsAjaxRequest=true&ajax=true&"+params, true) : ajaxRequest.open(method, URL+connector+time+"&IsAjaxRequest=true&ajax=true", true)
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
				params != null && method == "POST" ? ajaxRequest.send(params) : ajaxRequest.send();
			}
			else {
				return false;
			}
		},
		
		detectEngines: function() {

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
		
		}
	},
	
	log: {
		ignorereports: false,
		reports: [],
		send: function (shortcode, human, output) {
			var report;
			// If debug mode is off, do nothing
			if (!ghostedit.debug || ghostedit.log.ignorereports) return true;
			
			// If report is invalid, log this ;)
			if (!shortcode || !human) {
				ghostedit.log ("log-emptyreport", "Badly formed log report sent.");
				return false;
			}
			
			// Save report to array
			ghostedit.log.reports.push ( {"shortcode": shortcode,"human": human} );
			
			// Output to outputarea
			if (output !== false) {
				ghostedit.log.output ({"shortcode": shortcode,"human": human}, output);
			}
			
			// Send event to unit test module
			ghostedit.test.registerlog (shortcode);
			
		},
		
		output: function (report, color) {
			if (!ghostedit.debug) return true;
			if (!color) color = "transparent";
			color = color == "success" ? "#bbff00" : color;
			color = color == "error" ? "#ff4949" : color;
			color = color == "warn" ? "#ffef49" : color;
			if (report && report.human && report.shortcode) {
				ghostedit.log.outputarea.innerHTML = "<p style='background-color:" + color + "'>" + report.human + "<span style='float: right'>(" + report.shortcode + ")</span>" + "</p>" + ghostedit.log.outputarea.innerHTML;
			}
		},
		
		outputbreak: function () {
			if (!ghostedit.debug) return true;
			ghostedit.log.outputarea.innerHTML = "<hr />" + ghostedit.log.outputarea.innerHTML;
		},
		
		init: function () {
			var div, i;
			
			// Insert output area
			if (!document.getElementById("ghostedit_logarea")) {
				div = document.createElement("div");
				div.id = div.className = "ghostedit_logarea";
				document.body.appendChild(div);
				ghostedit.log.outputarea = div;
				
				// Populate with existing logs, or send welcome message
				if (ghostedit.log.reports.length > 0) {
					for (i = 0; i < ghostedit.log.reports.length; i++) {
						ghostedit.log.output (ghostedit.log.reports[i]);
					}
				}
				ghostedit.log.send ("log-start", "Start GhostEdit logging...");
			}
		}
	},
	
	test: {
		testlist: [],
		testlogs: [],
		testid: 0,
		runningtest: false,
		register: function (test) {
			if (!test) return false;
			if (!test.name) return false;
			if (!test.action || typeof test.action !== "function") return false;
			if (!test.expectedlog || Object.prototype.toString.call (test.expectedlog) !== "[object Array]") test.expectedlog = [];
			
			// Push test to array
			ghostedit.test.testlist.push (test);
		},
		
		registerlog: function (shortcode) {
			if (ghostedit.test.runningtest) {
				ghostedit.test.testlogs[ghostedit.test.runningtest].push(shortcode);
			}
		},
				
		runall: function () {
			var i, result, numpassed = 0, color;
			
			// Reset test tracking variables
			ghostedit.test.testid = 0;
			ghostedit.test.testlogs = [];
			
			// Loop through and run each test
			for (i = 0; i < ghostedit.test.testlist.length; i++) {
				result = ghostedit.test.run (ghostedit.test.testlist[i]);
				if (result) numpassed += 1;
			}
			
			// Get color based on % of tests passed
			color = "error";
			if (numpassed > 0) { color = "warn"; };
			if (numpassed == i) { color = "success"; };
			
			// Output result + linebreak
			ghostedit.log.output ({"shortcode": "test-finish","human": i + " tests run. " + numpassed + " passed."}, color);
			ghostedit.log.outputbreak();
		},
		
		run: function (test) {
			var testid;
			
			// Get testid
			ghostedit.test.testid += 1;
			testid = ghostedit.test.testid;
			
			// If test has prepare function, run it
			ghostedit.log.ignorereports = true;
			if (test.prepare) {
				test.prepare();
			}
			ghostedit.log.ignorereports = false;
			
			// Create test log and set running test to current
			ghostedit.test.testlogs[testid] = [];
			ghostedit.test.runningtest = testid;
			
			ghostedit.log.outputbreak();
			
			// Call action function
			test.action();
			
			// If requested, check DOM
			if (test.expecteddom) {
				ghostedit.test.checkDOM (test.expecteddom, ghostedit.editdiv);
			}
			
			ghostedit.test.runningtest = false;
			
			// If test has tidy function, run it
			ghostedit.log.ignorereports = true;
			if (test.tidy) {
				test.tidy();
			}
			ghostedit.log.ignorereports = false;
						
			// Compare test log to expected log and output result
			if (ghostedit.test.testlogs[testid].length === test.expectedlog.length) {
				for (i = 0; i < ghostedit.test.testlogs[testid].length; i++) {
					if (ghostedit.test.testlogs[testid][i] !== test.expectedlog[i]) {
						ghostedit.log.output ({"shortcode": "test-result","human": "Test " + testid + " (" + test.name + ") failed."}, "error");
						return false;
					}
				}
				ghostedit.log.output ({"shortcode": "test-result","human": "Test " + testid + " (" + test.name + ") passed."}, "success");
				return true;
			}
			else {
				ghostedit.log.output ({"shortcode": "test-result","human": "Test " + testid + " (" + test.name + ") failed."}, "error");
				return false;
			}
		},
		
		checkDOM: function (/*expected*/ json, /*actual*/ dom) {
			var result;
			if (Object.prototype.toString.call (json) === "[object Array]") json = {"childNodes": json};
			result = ghostedit.test.compareDOMnode(json, dom, 1);
			if (result !== false) {
				ghostedit.log.send("test-domcheck-pass", "DOM structure as expected.");
			}
		},
		
		compareDOMnode:  function (/*expected*/ json, /*actual*/ dom, level) { // recursive
			var firstdomchild, nextdomchild, domchildren = [], x, exp, act, result;
			
			if (!level) level = 1;
			if (!json || !ghostedit.dom.isGhostBlock(dom)) return null;
			
			// Read dom node into JSON
			if (firstdomchild = ghostedit.dom.getFirstChildGhostBlock(dom)) {
				x = 0;
				domchildren[x] = {};
				domchildren[x].rawnode = firstdomchild;
				domchildren[x].tagName = firstdomchild.tagName.toLowerCase();
				domchildren[x].textContent = (firstdomchild.innerText || firstdomchild.textContent).replace(/(\r\n|\n|\r)/g,"");
				while (nextdomchild = ghostedit.dom.getNextSiblingGhostBlock (domchildren[x].rawnode)) {
					x += 1;
					domchildren[x] = {};
					domchildren[x].rawnode = nextdomchild;
					domchildren[x].tagName = nextdomchild.tagName.toLowerCase();
					domchildren[x].textContent = (nextdomchild.innerText || nextdomchild.textContent).replace(/(\r\n|\n|\r)/g,"");
				}
			}
			
			if (json.childNodes) {
				for (i = 0; i < json.childNodes.length; i++) {
					// If domchild at index i doesn't exist, return 'too few nodes'
					if (!domchildren[i]) {
						ghostedit.log.send("test-domcheck-lev" + level + "ind" + (i+1) + "toofew", "Expected GhostBlock level " + level + "index" + (i+1) + " missing.");
						return false;
					}
					// Read expected and actual nodes into variables
					exp = json.childNodes[i];
					act = domchildren[i];
					
					// Check tagName equivalency if requested
					if (exp.tagName) {
						if (exp.tagName.toLowerCase() !== act.tagName) {
							ghostedit.log.send("test-domcheck-lev" + level + "ind" + (i+1) + "tagbad", "Tag mismatch at GhostBlock level " + level + " index " + (i+1) + ".<br />Expected '" + exp.tagName.toLowerCase() + "' Found '" + act.tagName + "'.");
							return false;
						}
					}
					
					// Check textContent equivalency if requested
					if (exp.textContent) {
						if (exp.textContent !== act.textContent) {
							ghostedit.log.send("test-domcheck-lev" + level + "ind" + (i+1) + "contentbad", "Content mismatch at GhostBlock level " + level + " index " + (i+1) + ".<br />Expected '" + exp.textContent + "' Found '" + act.textContent + "'.");
							return false;
						}
					}
					
					// Compare DOM of childnode
					result = ghostedit.test.compareDOMnode (exp, act.rawnode, level + 1);
					if (result === false) {
						return false;
					}
				}
				// If there is still a domchild after all json children have bene tested, return 'too many nodes'
				if (domchildren.length > json.childNodes.length) {
					ghostedit.log.send("test-domcheck-lev" + level + "index" + (i+1) + "toomany", "Unexpected GhostBlock at level " + level + " index " + (i+1) + ". (exp = " + json.childNodes.length + ")");
					return false;
				}
			}
			else {
				if (domchildren.length > 0) {
					ghostedit.log.send("test-domcheck-lev" + level + "index" + (i+1) + "toomany", "Unexpected GhostBlock at level " + level + " index " + (i+1) + ". (exp = 0)");
					return false;
				}
			}
			return true;
		}
	},
	
	
	event: {
		cancelKeypress: false, //allows onkeypress event to be cancelled from onkeydown event.
		editKeydown: function (elem,e) { //allows deleteIfBlank() to fire (doesn't work on onkeypress except in firefox)
			var keycode, ghostblock, handler, handled;
			ghostedit.selection.save();

			//e = !(e && e.istest) || window.event != null ? window.event : e;
			keycode = e.keyCode != null ? e.keyCode : e.charCode;
			ghostedit.log.send("event-keydown-" + keycode, "A key with keycode " + keycode + " was pressed DOWN");
			
			// Global shortcuts
			switch(keycode) {
				case 8: //backspace
					//alert("0");
					cancelKeypress = false;
					if(ghostedit.selection.savedRange.isCollapsed() === false) {
						ghostedit.event.deleteSelectionContents();
						//alert("1");
						cancelKeypress = true;//otherwise opera fires default backspace event onkeyPRESS (not onkeyDOWN)
						return ghostedit.util.cancelEvent ( e );
					} 
				break;9
				case 46: // delete key
					//alert("0");
					cancelKeypress = false;
					if(ghostedit.selection.savedRange.isCollapsed() === false) {
						ghostedit.event.deleteSelectionContents();
						//alert("1");
						cancelKeypress = true;//otherwise opera fires default backspace event onkeyPRESS (not onkeyDOWN)
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				/*case 9: //tab
						ghostedit.selection.deleteContents();
						ghostedit.selection.savedRange.pasteText("??", true);
						return ghostedit.util.cancelEvent ( e );
				break;*/
				case 83: //ctrl-s
					if (e.ctrlKey){
						ghostedit.inout.save();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 66: //ctrl-b
					if (e.ctrlKey) {
						ghostedit.format.bold ();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 73: //ctrl-i
					if (e.ctrlKey && !e.shiftKey) {
						ghostedit.format.italic ();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 85: //ctrl-u
					if (e.ctrlKey) {
						ghostedit.format.underline ();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 90: //ctrl-z
					if (e.ctrlKey) {
						ghostedit.history.undo ();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 89: //ctrl-y
					if (e.ctrlKey) {
						ghostedit.history.redo ();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 69: //ctrl-e
					if (e.ctrlKey) {
						ghostedit.debug = !ghostedit.debug;
						return ghostedit.util.cancelEvent ( e );
					}
				break;
				case 84: //ctrl-t
					if (e.ctrlKey) {
						ghostedit.selection.savedRange.saveToDOM();
						return ghostedit.util.cancelEvent ( e );
					}
				break;
			}
			
			// Not handled by one of above
			
			ghostedit.history.saveUndoState();
			
			ghostblock = ghostedit.selection.getContainingGhostBlock();
			while (true) {
				handler = ghostblock.getAttribute("data-ghostedit-handler");
				handled = ghostedit[handler].ghostevent("keydown", ghostblock, "self", {"keycode": keycode, "event": e});
				if (handled === true) break;
				
				ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
				if (!ghostblock) break;
			}
			
			//lasso().setToSelection().collapseToStart().select();
			
			ghostedit.history.saveUndoState();
			ghostedit.selection.save();
			return true;
		},
			
		
		editKeypress: function (elem,e) {//backspace code commented as it doesnt work (added to onkeydown with function editKeydown() instead)
			var keycode, ghostblock, handler, handled, currentDocLen, savedDocLen;
			ghostedit.selection.save();
			
			currentDocLen = ghostedit.editdiv.innerHTML.length;
			savedDocLen = ghostedit.history.undoData[ghostedit.history.undoPoint].length !== undefined ? ghostedit.history.undoData[ghostedit.history.undoPoint].length : 0;
			if (currentDocLen - savedDocLen >= 20 || savedDocLen - currentDocLen >= 20) ghostedit.history.saveUndoState();
			
			//e = window.event != null ? window.event : e;
			keycode = e.keyCode != null ? e.keyCode : e.charCode;
			
			ghostedit.log.send("event-keypress-" + keycode, "A key with keycode " + keycode + " was pressed");
			
			if (ghostedit.selection.isvalid && !ghostedit.selection.savedRange.isCollapsed() && !e.ctrlKey) {
				ghostedit.selection.deleteContents();
			}
			
			// Global keyevents
			switch(keycode) {
				case 8: //cancel backspace event in opera if cancelKeypress = true
					if (cancelKeypress == true) {
						cancelKeypress = false;
						return ghostedit.util.cancelEvent ( e );
					}
				break;
			}
			
			ghostblock = ghostedit.selection.getContainingGhostBlock();
			while (true) {
				handler = ghostblock.getAttribute("data-ghostedit-handler");
				handled = ghostedit[handler].ghostevent("keypress", ghostblock, "self", {"keycode": keycode, "event": e});
				if (handled === true) break;
				
				ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
				if (!ghostblock) break;
			}
			
			ghostedit.selection.save();
			return true;
		},
		
		deleteSelectionContents: function () {
			
			ghostedit.history.saveUndoState();
			
			ghostedit.log.send("event-delselcont", "Delete selection contents.");
			
			var ghostblock = ghostedit.selection.getContainingGhostBlock();
			
			while (true) {
				handler = ghostblock.getAttribute("data-ghostedit-handler");
				handled = ghostedit[handler].deleteSelectionContents(ghostblock);
				if (handled === true) break;
				
				ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
				if (!ghostblock) break;
			}
						
			lasso().setToSelection().collapseToStart().select();
			
			ghostedit.history.saveUndoState();
			ghostedit.selection.save();
		},
		
		backspace: function () {
			
			
		},
		
		imageKeydown: function (e) {
			e = window.event != null ? window.event : e;
			var keycode = e.keyCode != null ? e.keyCode : e.charCode;
			
			switch(keycode) {
				case 8:
				case 46:
					ghostedit.image.remove(e);
				break;
				case 90:
					if (e.ctrlKey) {
						ghostedit.history.undo ();
					}
				break;
				case 89:
					if (e.ctrlKey) {
						ghostedit.history.redo ();
					}
				break;
				case 37:
					ghostedit.image.align("left", e);
				break;
				case 38:
					ghostedit.image.moveup(e);
				break;
				case 39:
					ghostedit.image.align("right", e);
				break;
				case 40:
					ghostedit.image.movedown(e);
				break;
			}
			return ghostedit.util.cancelEvent ( e );
		},
		
		urlBoxKeypress: function (e)
		{
			e = window.event != null ? window.event : e;
			var keycode = e.keyCode != null ? e.keyCode : e.charCode;
			
			switch(keycode) {
			case 13:
				ghostedit.link.create();
				ghostedit.ui.modal.hide();
				return false;
			break;
			}
			return true;
		},
		
		linkButtonClick: function () {
			//ghostedit.selection.save();
			if (ghostedit.selection.savedRange.isCollapsed()) {
				range = ghostedit.selection.savedRange.clone();
				/*if (!document.createRange && document.selection) {
					range.getNative().pasteHTML("<span id='ghostedit_marker'>z</span>")
					range.selectNodeContents("ghostedit_marker");
				}*/
				range = ghostedit.selection.extendtoword(range, true);
				range.select();
				ghostedit.selection.save();
			}
			
			if (ghostedit.selection.savedRange.isCollapsed()) {
				/*var modalcontent = "<h3>Create link</h3><form>" + 
				"<label for='ghostedit_urlinput'>Url:</label><input type='text' value='http://' id='ghostedit_urlinput' onkeypress='return ghostedit.event.urlBoxKeypress(event);'/><br />" +
				"<label for='ghostedit_linktextinput'>Text:</label><input type='text' id='ghostedit_linktextinput' onkeypress='return ghostedit.event.urlBoxKeypress(event);'/>" +
				"<input type='button' value='Create' style='float: right;margin-top: 10px;' onclick='ghostedit.link.create();ghostedit.ui.modal.hide();' />" +
				"</form>";
				ghostedit.ui.modal.show(modalcontent);
				document.getElementById('ghostedit_linktextinput').value = ghostedit.selection.savedRange.getText();
				document.getElementById('ghostedit_urlinput').focus();*/
				
				//TODO standards based link insert
				if (document.createRange) {
					//Create <a> element, range.insertNode()
				}
				else if (document.selection) {
					//TODO selection is never collapsed
					ghostedit.selection.savedRange.getNative().pasteHTML("<a id='ghostedit_newlink' href='http://'>Link Text</a>")
					lasso().selectNodeContents("ghostedit_newlink").select();
					document.getElementById("ghostedit_newlink").id = "";
				}
				//ghostedit.selection.savedRange.pasteText("Link Text", false);
			}
			else {
				ghostedit.link.create("http://");
				ghostedit.selection.save();
				//document.getElementById('ghostedit_toolbar_linkurl').select();
				
				/*if (document.getElementById("ghostedit_marker")) {
					lasso().selectNode("ghostedit_marker").deleteContents().select();
				}*/
				ghostedit.link.focusedlink.href = "http://";
				ghostedit.ui.toolbar.enabletab("link");
				ghostedit.ui.toolbar.showtab("link");
				document.getElementById('ghostedit_toolbar_linkurl').focus();
				//document.getElementById('ghostedit_toolbar_linkurl').value = document.getElementById('ghostedit_toolbar_linkurl').value;
				ghostedit.selection.save();
			}
		},
		
		imageButtonClick: function () {
			ghostedit.selection.save();
			var i, that = [], elem, images, modalcontent;
			modalcontent = "<h2>Insert image</h2><form>" +
			"<p>This dialog allows you to choose an image to insert into the document. Either select one from the list of uploaded images, or enter a custom url in the box below.</p>" +
			"<hr />" +
			//"<h3 style='clear: both;'>Upload new image</h3>" +
			//"<div id='ghostedit_imageuploadarea'><noscript>noscript</noscript></div>" +
			//"<hr />" +
			"<h3 style='clear: both;'>Select uploaded image</h3>" +
			"<div id='ghostedit_listbox' style='height: 200px;overflow-x: hidden;overflow-y: scroll;background: white; border: 1px solid #ccc'></div>" +
			"<hr />" +
			"<h3>Or enter URL</h3>" +
			"<input type='text' value='' id='ghostedit_imageurlinput' style='width: 99%' /><br />" +
			"<input type='button' value='Insert' style='float: right;margin-top: 10px;' onclick='ghostedit.image.newImageBefore(null, null);ghostedit.ui.modal.hide();' />" +
			"</form>" +
			"";
			
			/*images = [
			{id: "5", name: "test3", url: "data/pages/images/large/5.jpg", thumburl: ""},
			{id: "6", name: "test2", url: "data/pages/images/large/6.jpg", thumburl: "data/pages/images/small/6.jpg"}
			];*/
			
			images = [];
			
			if(ghostedit.options.uploadedimages) {
				images = ghostedit.options.uploadedimages;
			}
			
			ghostedit.ui.modal.show(modalcontent);
			
			for(i = 0; i < images.length; i += 1) {
				elem = document.createElement("div");
				elem.className = "ghostedit-listbox-item";
				elem.setAttribute("ghostedit-listitem-value", images[i].url);
				elem.innerHTML = "<img src='" + images[i].thumburl + "' style='height: 60px; float: left' /><p style='margin-left: 100px;font-size: 21px'>" + images[i].name + "</p>";
				elem.onclick = function () {
					ghostedit.image.newImageBefore(null, this.getAttribute("ghostedit-listitem-value"), false);
					ghostedit.ui.modal.hide();
				}
				document.getElementById("ghostedit_listbox").appendChild(elem);
			}
			
			document.getElementById('ghostedit_imageurlinput').focus();
		},
		
		toolbarClick: function (e) {
			if (!ghostedit.event.allowtoolbarclick && !ghostedit.image.focusedimage) {
				//Causes toolbar text field not to be selectable. ghostedit.selection.restore();
				ghostedit.util.cancelAllEvents (e);
			}
		},
		
		sendBackwards: function (eventtype, source, params) {
			var target = false, tracker, handler, handled = false, result;
			if (!params) params = {};
			if (!ghostedit.dom.isGhostBlock(source)) return false;
			
			tracker = source; //tracks currently tried targets
			
			while(true) {
				
				if (target = ghostedit.dom.getPreviousSiblingGhostBlock(tracker)) {
					direction = "ahead";
				}
				else if (target = ghostedit.dom.getParentGhostBlock(tracker)) {
					direction = "top";
				}
				
				//alert("source - " + source.id + "\ntarget - " + target.id);
				
				result = ghostedit.event.send (eventtype, target, direction, params);
				
				//if (result) alert("source - " + source.id + "\ntarget - " + target.id + "\nresult - " + result.handled);
				//else alert("source - " + source.id + "\ntarget - " + target.id + "\nresult - false");
				
				if (!result) return false;
				else if (result.handled === true) return true;
				
				tracker = target;
			}
		},
		
		sendForwards: function (eventtype, source, params) {
			var target = false, tracker, handler, handled = false, result, direction;
			if (!params) params = {};
			if (!ghostedit.dom.isGhostBlock(source)) return false;
			
			tracker = source; //tracks currently tried targets
			
			while(true) {
				
				if (target = ghostedit.dom.getNextSiblingGhostBlock(tracker)) {
					direction = "behind";
				}
				else if (target = ghostedit.dom.getParentGhostBlock(tracker)) {
					direction = "bottom";
				}
				
				if ( !(result = ghostedit.event.send (eventtype, target, direction, params)) ) return false;
				else if (result.handled === true) return true;
				
				tracker = target;
			}
		},
		
		send: function (eventtype, target, fromdirection, params) {
			var handler, handled;

			if (!target) return false; // = no previous/next GhostBlock

			handler = target.getAttribute("data-ghostedit-handler");
			if (!ghostedit[handler] || !ghostedit[handler].ghostevent) return false; // = no handler for this elemtype
			
			handled = ghostedit[handler].ghostevent (eventtype, target, fromdirection, params);

			return {"handled": handled};
			
		},
		
		legacysend: function (direction, eventtype, source, params) {
			var target = false, handler, handled = false;
			if (!ghostedit.dom.isGhostBlock(source)) return false;
			while(handled = false) {
						
				switch (direction) {
					case "backwards":
						target = ghostedit.dom.getPreviousSiblingGhostBlock(source);
						if (!target) target = ghostedit.dom.getParentGhostBlock(source);
					break;
					case "forwards":
						target = ghostedit.dom.getNextSiblingGhostBlock(source);
						if (!target) target = ghostedit.dom.getParentGhostBlock(source);
					break;
				}
				
				if (!target) { // = no previous/next GhostBlock
					return false;
				} else {
					handler = target.getAttribute("data-ghostedit-elemtype");
					if (!ghostedit.handler) return false; // = no handler for this elemtype
					handled = ghostedit.handler.ghostevent (eventtype, source, params);
				}
			}
		}
	},
	
	dom: {
		getNodeOffset: function (node) {
			var offset, nodelist;
			
			if (!node || !node.parentNode) return;
			
			offset = 0;
			nodelist = node.parentNode.childNodes;
			
			while (nodelist[offset] !== node) {
				offset += 1;
			}
			return offset;
		},
		
		isGhostBlock: function (node) {
			if (!node || !node.nodeType || node.nodeType !== 1) return false;
			
			var ghosttype = node.getAttribute("data-ghostedit-elemtype");
			
			return (ghosttype !== undefined && ghosttype !== false && ghosttype !== null) ? true : false; 
		},
		
		isGhostToplevel: function (node) {
			return (node && node.getAttribute("data-ghostedit-isrootnode") === true) ? true : false;
		},
		
		getParentGhostBlock: function (node) {
			
			if (!node) return false;
			
			do {
				node = node.parentNode;
				if (node == null) return false;
			}
			while (!ghostedit.dom.isGhostBlock(node));
			
			return node;
		},
		
		getFirstChildGhostBlock: function (node) {
			var children;
			
			if (!node || !node.childNodes) return false;			
			
			// Otherwise, recurse forwards through DOM until first GhostBlock is found.
			children = node.childNodes;
			
			for (i = 0; i < children.length; i += 1) {
				if (ghostedit.dom.isGhostBlock(children[i])) {
					return children[i];
				}
			}
			
			return false;
		},
		
		getLastChildGhostBlock: function (node) {
			var children;
			
			if (!node || !node.childNodes) return false;			
			
			// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
			children = node.childNodes;
			
			for (i = children.length -1; i >= 0; i -= 1) {
				if (ghostedit.dom.isGhostBlock(children[i])) {
					return children[i];
				}
			}
			
			return false;
		},
		
		getPreviousSiblingGhostBlock: function (node) {
			var parent, offset, siblings;
			
			if (!node || !node.parentNode) return false;			
			
			// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
			parent = node.parentNode;
			offset = ghostedit.dom.getNodeOffset (node) - 1;
			siblings = parent.childNodes;
			
			do {
				if (ghostedit.dom.isGhostBlock(siblings[offset]) === true)  {
					return siblings[offset];
				}
				offset -= 1;
			}
			while (offset >= 0);
			
			return false;
		},
		
		getNextSiblingGhostBlock: function (node) {
			var parent, offset, siblings;
			
			if (!node || !node.parentNode) return false;			
			
			// Otherwise, recurse forwards through DOM until next GhostBlock is found.
			parent = node.parentNode;
			offset = ghostedit.dom.getNodeOffset (node) + 1;
			siblings = parent.childNodes;
			
			do {
				if (ghostedit.dom.isGhostBlock(siblings[offset]) === true)  {
					return siblings[offset];
				}
				offset += 1;
			}
			while (offset < siblings.length);
			
			return false;
		},
		
		getFirstChildElement: function (node) {
			var children;
			
			if (!node || !node.childNodes) return false;			
			
			// Otherwise, recurse forwards through DOM until next element is found.
			children = node.childNodes;
			
			for (i = 0; i < children.length; i += 1) {
				if (children[i].nodeType === 1) {
					return children[i];
				}
			}
			
			return false;
		}
		
	},
	
	selection: {
		isvalid: false, savedRange: null, endpoint: null, startpoint: null,
		currentInlineEditElem: "", //the ghostedit_textblock_ elem that has focus or most recently had focus [Deprecated in favour of using ghostedit.selection.savedRange.(start/end)node]
		nodepath: [],
		typeChangerLookup: { "H1":"ghostedit_toolbar_formath1box",
								"h1":"ghostedit_toolbar_formath1box",
								"H2":"ghostedit_toolbar_formath2box",
								"h2":"ghostedit_toolbar_formath2box",
								"H3":"ghostedit_toolbar_formath3box",
								"h3":"ghostedit_toolbar_formath3box",
								"P":"ghostedit_toolbar_formatpbox",
								"p":"ghostedit_toolbar_formatpbox",
								"div": false}, 
		
		save: function () {
		
			if (!ghostedit.selection.isInEditdiv(lasso().setToSelection().getStartNode())) {
				ghostedit.selection.isvalid = false;
				return false;
			}
			else {
				//Save current selection to range
				ghostedit.selection.savedRange = lasso().setToSelection();
			
				//Register if selection is valid within the ghostedit area
				ghostedit.selection.isvalid = true;

				ghostedit.selection.updatePathInfo();
				ghostedit.ui.api.update();
				return true;
			}
		},
		
		restore: function () {
			ghostedit.selection.savedRange.select();
		},
		
		isInEditdiv: function (elem) {
			var elem, i;
			if (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
				while (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
					if (elem == null) return false;
					elem = elem.parentNode;
					if (elem == null) return false;
				}
			}
			return true;
		},
		
		updatePathInfo: function (elem) {
			var bold = false, italic = false, underline = false, aelem = false, i, formatboxes;
			
			ghostedit.selection.nodepath = [];
			if (!elem) elem = ghostedit.selection.savedRange.getParentNode();
			
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
					
					if (elem == null) return null;
					
					if (elem.nodeType == 1)	ghostedit.selection.nodepath.push(elem);
					
					elem = elem.parentNode;
					
					if (elem == null) return false;
				}
			}
			
			// Make sure rootnode/editdiv is also included in path
			if (elem && elem.getAttribute("data-ghostedit-isrootnode") == "true") {
					ghostedit.selection.nodepath.push(elem);
			}
		},
		
		gettextblockNode: function (elem) {
			if (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-elemtype") != "textblock") {
				while (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-elemtype") != "textblock") {
					elem = elem.parentNode;
					if (elem == null) return false;
				}
			}
			return elem;
		},
		
		
		getCertainParent: function (condition, elem) {
			var args = [].slice.call(arguments);
			args.shift();
			if (!condition.apply(this, args)) {
				while (!condition.apply(this, args)) {
					elem = elem.parentNode;
					args[0] = elem;
					if (elem == null) return false;
				}
			}
			return elem;
		},
		
		getGhostBlock: function (elem) {
			if (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-elemtype") === undefined || elem.getAttribute("data-ghostedit-elemtype") === false) {
				while (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-elemtype") === undefined || elem.getAttribute("data-ghostedit-elemtype") === false) {
					elem = elem.parentNode;
					if (elem == null) return false;
				}
			}
			return elem;
		},
		
		getContainingGhostBlock: function () {			
			var node = ghostedit.selection.savedRange.getParentNode()
			if (!node) return false;

			while (!ghostedit.dom.isGhostBlock(node)) {
				node = node.parentNode;
				if (node == null) return false;
			}
			
			return node;
		},
		
		/* replaced by almost identical function above ( but above uses data attributes instead of class)
		isInEditdiv: function (elem) {
			if (elem.nodeType != 1 || elem.className != "ghostedit_editdiv") {
				while (elem.nodeType != 1 || elem.className != "ghostedit_editdiv") {
					elem = elem.parentNode;
					if (elem == null) return false;
				}
			}
			return elem;
		}, */
		
		getParentElement: function (node) {
			if (node.nodeType != 1) {
				while (node.nodeType != 1) {
					node = node.parentNode;
					if (node == null) return null;
				}
			}
			return node;
		},
		
		getStarttextblockNode: function () {
			return ghostedit.selection.gettextblockNode( ghostedit.selection.savedRange.getStartNode() );
		},
		
		getEndtextblockNode: function () {
			return ghostedit.selection.gettextblockNode( ghostedit.selection.savedRange.getEndNode() );
		},
		
		getPrevioustextblockNode: function (textblockelem) {
			var textblockelems, thisone;
			textblockelems = ghostedit.editdiv.getElementsByTagName("*");
			thisone = false;
			for(i = textblockelems.length - 1; i >= 0; i -= 1) {
				if (thisone === true && textblockelems[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
					return textblockelems[i];
				}
				else if (textblockelems[i] === textblockelem) {
					thisone = true;
				}
			}
		},
		
		getNexttextblockNode: function (textblockelem) {
			var textblockelems, thisone;
			textblockelems = ghostedit.editdiv.getElementsByTagName("*");
			thisone = false;
			for(i = 0; i < textblockelems.length; i += 1) {
				if (thisone === true && textblockelems[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
					return textblockelems[i];
				}
				else if (textblockelems[i] === textblockelem) {
					thisone = true;
				}
			}
		},

		
		//Assumes selection saved manually
		isAtStartOftextblock: function () {
			var caretIsAtStart = false, tempnode, range, selrange, savedRange, i, isequal, prevchar, startpoint;
			
			if(document.createRange) {
				if(ghostedit.selection.savedRange.isCollapsed() && ghostedit.selection.savedRange.getNative().startOffset == 0) {
					caretIsAtStart = true;
					tempnode = ghostedit.selection.savedRange.getStartNode();
				}
				
				if (!tempnode) return caretIsAtStart;
			
				// If tempnode not right at start
				while (tempnode.nodeType !== 1 || tempnode.getAttribute("data-ghostedit-elemtype") !== "textblock") {
					if (tempnode !== tempnode.parentNode.childNodes[0]) {
						isequal = false;
						//alert(tempnode.parentNode.childNodes[0].nodeType);
						//alert(tempnode.parentNode.childNodes[0].length);
						if((tempnode.parentNode.childNodes[0].nodeType === 3 && tempnode.parentNode.childNodes[0].length === 0)
								|| (tempnode.parentNode.childNodes[0].nodeType === 1 && tempnode.parentNode.childNodes[0].className === "moz_dirty")) {
							//Deals with empty text nodes at start of textblock elem
							for(i = 1; i < tempnode.parentNode.childNodes.length; i += 1) {
								if (tempnode == tempnode.parentNode.childNodes[i]) {
									isequal = true;
									break;
								}
								else if(!(tempnode.parentNode.childNodes[0].nodeType === 3 && tempnode.parentNode.childNodes[0].length === 0)
								&& !(tempnode.parentNode.childNodes[0].nodeType === 1 && tempnode.parentNode.childNodes[0].className === "moz_dirty")) {
									break;
								}
							}
						}
						if(isequal !== true) {
							caretIsAtStart = false;
							break;
						}
					}
					tempnode = tempnode.parentNode;
				}	
			}
			else if (document.selection) {
				// Bookmarkify range, so DOM modification doesn't break it
				selrange = ghostedit.selection.savedRange.clone().bookmarkify();
				
				// Get range representing the end of the TextBlock
				textblocknode.innerHTML = textblocknode.innerHTML + "<span id=\"range_marker\">&#x200b;</span>";
				startpoint = lasso().selectNode('range_marker');//.deleteContents();
				document.getElementById('range_marker').parentNode.removeChild(document.getElementById('range_marker'));
				
				// Unbookmarkify the range, so it can be used in comparisons again
				selrange.unbookmarkify();
				
				// Compare endpoint to selected point, if equal then selection is at the end of the textblock
				if (selrange.compareEndPoints("StartToStart", startpoint) === 0) {
					caretIsAtStart = true;
				}
				ghostedit.selection.savedRange = selrange.select();
			}
			return caretIsAtStart;
		},

		
		//Assumes selection saved manually
		isAtEndOftextblock: function () {
			/* Check if caret is at very start of textblock elem */
			var caretIsAtEnd = false, tempnode, selrange, range, savedRange, i, isequal, prevchar, rangefrag, elemfrag, textblocknode, prevchar, savedrange, endpoint, wholenode;
			
			if (!ghostedit.selection.savedRange.isCollapsed()) return false;
			
			textblocknode = ghostedit.selection.getEndtextblockNode();
			if(document.createRange) {
				
				rangefrag = document.createElement("div");
				rangefrag.appendChild( ghostedit.selection.savedRange.getNative().cloneContents() );
				
				range = ghostedit.selection.savedRange.getNative()
				range.setEnd(textblocknode, textblocknode.childNodes.length);
				elemfrag = document.createElement("div");
				rangefrag.appendChild( range.cloneContents() );
				
				ghostedit.textblock.mozBrs.clear(rangefrag);
				ghostedit.textblock.mozBrs.clear(elemfrag);
				
				if(rangefrag.innerHTML == elemfrag.innerHTML) {
					caretIsAtEnd = true;
				}
			}
			else if (document.selection) {
				// Bookmarkify range, so DOM modification doesn't break it
				selrange = ghostedit.selection.savedRange.clone().bookmarkify();
				
				// Get range representing the end of the TextBlock
				textblocknode.innerHTML += "<span id=\"range_marker\">&#x200b;</span>";
				endpoint = lasso().selectNode('range_marker');//.deleteContents();
				document.getElementById('range_marker').parentNode.removeChild(document.getElementById('range_marker'));
				
				// Unbookmarkify the range, so it can be used in comparisons again
				selrange.unbookmarkify();
				
				// Compare endpoint to selected point, if equal then selection is at the end of the textblock
				if (selrange.compareEndPoints("EndToEnd", endpoint) === 0) {
					caretIsAtEnd = true;
				}
				ghostedit.selection.savedRange = selrange.select();
			}
			return caretIsAtEnd;
		},
		
		extendtoword: function (range, onlyfrommiddle) {
			var wordstart, wordend;
			range = range.clone().getNative();
			if (document.createRange) {
				wordstart = ghostedit.selection.findwordstart (range.startContainer, range.startOffset);
				wordend = ghostedit.selection.findwordend (range.endContainer, range.endOffset);
				
				//If only one end has moved, then it's not from the middle
				if (onlyfrommiddle) {
					if (range.startContainer == wordstart.node && range.startOffset == wordstart.offset) return range;
					if (range.endContainer == wordend.node && range.endOffset == wordend.offset) return range;
				}
				
				range.setStart(wordstart.node, wordstart.offset);
				range.setEnd(wordend.node, wordend.offset);
			}
			else {
				range.expand("word");
				//alert(range.getHTML());
				if (range.htmlText.split().reverse()[0] == " ") {
					range.moveEnd("character", -1);
				}
			}
			return lasso().setFromNative(range);
		},
		
		findwordstart: function (node, offset) {
			var r, range, leftnodecontent, stroffset, totalstroffset, prevnode, wordendregex;
			
			if (!node || !node.nodeType) return false;
			
			//Handle text node
			if (node.nodeType === 3) {
				leftnodecontent = node.nodeValue.substring(0, offset);
				stroffset = leftnodecontent.search(ghostedit.wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if(stroffset !== -1) {
					totalstroffset = stroffset + 1;
					while ((stroffset = leftnodecontent.substring(totalstroffset).search(ghostedit.wordendregex)) !== -1) {
						totalstroffset += stroffset + 1;
					}
					return { node: node, offset: totalstroffset };
				}
			}
			//Handle Element
			else if (node.nodeType === 1) {
				if (offset > 0) {
					return ghostedit.selection.findwordstart(node.childNodes[offset - 1], node.childNodes[offset - 1].length);
				}
			}
			
			//If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (node.nodeType === 1 && node.className && node.getAttribute("data-ghostedit-elemtype") == "textblock"){
				return {
					node: node,
					offset: offset
				}
			}
			//If node is a NOT ghostedit_textblock: check previous node
			if (prevnode = node.previousSibling) {
				if (prevnode.nodeType === 3) {
					return ghostedit.selection.findwordstart(prevnode, prevnode.nodeValue.length);
				}
				else if (prevnode.nodeType === 1) {
					return ghostedit.selection.findwordstart(prevnode, prevnode.childNodes.length);
				}
			}
			//If node is a NOT ghostedit_textblock and no previousSibling: move up tree
			else {
				return ghostedit.selection.findwordstart(node.parentNode, ghostedit.dom.getNodeOffset(node));
			}
			
			
		},
		
		findwordend: function (node, offset) {
			//alert(node + offset + " : " + node.childNodes.length);
			var r, range, rightnodecontent, stroffset, totalstroffset, prevnode, wordendregex;
			
			if (!node || !node.nodeType) return false;
			
			//Handle text node
			if (node.nodeType === 3) {
				rightnodecontent = node.nodeValue.substring(offset);
				stroffset = rightnodecontent.search(ghostedit.wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if (stroffset !== -1) {
					totalstroffset = offset + stroffset;
					return { node: node, offset: totalstroffset };
				}
			}
			//Handle Element
			else if (node.nodeType === 1) {
				if (offset < node.childNodes.length) {
					return ghostedit.selection.findwordend(node.childNodes[offset], 0);
				}
			}
			
			
			//If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (node.className && node.getAttribute("data-ghostedit-elemtype") == "textblock"){
				return {
					node: node,
					offset: offset
				}
			}
			//If node is a NOT ghostedit_textblock: check next node
			else if (nextnode = node.nextSibling) {
				return ghostedit.selection.findwordend(nextnode, 0);
			}
			//If node is a NOT ghostedit_textblock and no nextSibling: move up tree
			else {
				return ghostedit.selection.findwordend(node.parentNode, ghostedit.dom.getNodeOffset(node) + 1);
			}
		}
	},
	
	inout: {
		importhandlers: [],
		importHTML: function (sourcenode) {
			var tagname, handler, domtree, editdiv;
			if (!sourcenode || sourcenode.childNodes.length < 1) return false;

			/*tagname = sourcenode.tagName.toLowerCase();
			if (handler = ghostedit.inout.importhandlers[tagname]) {
				result = ghostedit[handler].api.importHTML(insertedelem, elem)
				if (result) insertedelem = result;
			}*/
			
			// Call container import, and set resulting domnode's contenteditable to true
			editdiv = ghostedit.container.api.importHTML(sourcenode);
			editdiv.className = "ghostedit_editdiv";
			editdiv.setAttribute("data-ghostedit-isrootnode", "true");
			editdiv.contentEditable = 'true';
			
			// Send 'postimport' event to plugins
			ghostedit.plugins.sendevent("postimport", {"editdiv": editdiv});
			
			// Return editdiv container
			return editdiv;			
		},
		
		exportHTML: function () {
			var editwrap = ghostedit.editdiv;
			var i = 0,elem,finalCode,params,handleResult,paracount,snippet, finalexport;
			
			//Preparation - contenteditable = false
			editwrap.contentEditable = false;
			
			ghostedit.image.unfocus ();
			ghostedit.link.unfocus();
			
			finalexport = ghostedit.container.api.exportHTML(ghostedit.editdiv, false);
			
			//Tidy up - contenteditable = true
			editwrap.contentEditable = true;
			
			return finalexport; //{snippet: snippet, full: finalCode};
		},
		
		save: function () {
			//Declare variables
			var i = 0,elem,finalCode,params,handleResult,paracount,snippet;
			
			//alert(finalCode);
			//Send data
			
			finalCode = ghostedit.inout.exportHTML();
			snippet = finalCode.snippet;
			finalCode = finalCode.content;
			
			params = [];
			params = params.concat(ghostedit.options.saveparams);
			params.push("name=" + encodeURIComponent(document.getElementById("ghostedit_toolbar_savename").value));
			params.push("url=" + encodeURIComponent(document.getElementById("ghostedit_toolbar_saveurl").value));
			params.push("snippet=" + encodeURIComponent(snippet));
			params.push("content=" + encodeURIComponent(finalCode));
			
			params = params.join("&");
			
			
			handleResult = function(success,response){
				var msg, breadcrumb, title;
				if (success && response === "true") {
					ghostedit.ui.message.show("Page was successfully saved :)", 1, "success");
					if (breadcrumb = document.getElementById("breadcrumb") ) {
						title = breadcrumb.innerHTML.split("\</a\> ");
						title.pop();
						breadcrumb.innerHTML = title.join("\</a\> ") + "</a> " + document.getElementById("ghostedit_toolbar_savename").value;
					}
				}
				else
				{
				//msg = success ? "There was an error saving this page - try a <a href='' onclick='savePage()'>hard save</a>." : "Page could not be saved, make sure you are connected to the internet and try again";
				msg = response;
				if(ghostedit.options.debug) alert(msg);
				ghostedit.ui.message.show(msg, 1, "error");
				}
			}
			ghostedit.util.ajax(ghostedit.options.saveurl, "POST", params, handleResult, "text");
		},

		openPreview: function () {
			window.open(ghostedit.options.previewurl);
		},
		
		registerimportcapability: function (plugin/*, names of plugins*/) {
			var i, j, args, tag, list;
			if (arguments.length < 2) return false;
			args = Array.prototype.slice.call(arguments);
			args.shift();
			
			// Loop through arguments
			for (i = 0; i < args.length; i++) {
				tag = args[i];
				
				ghostedit.inout.importhandlers[tag] = plugin;
			}
		}
	},
	
	plugins: {
		list: [],
		register: function (/*names of plugins*/) {
			var i, j, args, name, list;
			args = Array.prototype.slice.call(arguments);
			
			// Loop through arguments
			argloop:
			for (i = 0; i < args.length; i++) {
				name = args[i];
				
				// Check to see if specified plugin object exists, break if not
				if (!ghostedit[name]) break;
				
				// Loop through existing array, break if plugin is already listed.
				listloop:
				for (j = 0; j < ghostedit.plugins.list.length; j++) {
				        if (ghostedit.plugins.list[j] === name) {
				            break argloop;
				        }
				}
				
				// Push plugin name to registered list
				ghostedit.plugins.list.push(name);
			}
		},
		sendevent: function (eventtype, params) {
			var i, plugin;
			for (i = 0; i < ghostedit.plugins.list.length; i++) {
			        plugin = ghostedit.plugins.list[i];
			        ghostedit[plugin].ghostevent(eventtype, false, false, params);
			}
		}
	},
	
	init: function (placediv, options) {
		if (typeof placediv === "string") placediv = document.getElementById(placediv);
		var wrapdiv, elems, i, j, brNode, oldDocRoot, isImg, img, insertedelem, lastelem = false, htmlelem, plugin;
		
		ghostedit.reset();
		ghostedit.active = true;
		
		// Set up user options
		ghostedit.options = {};
		if (options) {
			ghostedit.options = options;
		}
		
		// Check for debug option (but only enable if log module exists)
		if (ghostedit.options.debug && ghostedit.log) {
			ghostedit.debug = true;
		}
		
		// Set default options
		if (!options.disableimageresize) options.disableimageresize = false;
		if (!options.flexibleimages) options.flexibleimages = false;
		if (!options.wordcount) options.wordcount = true;
		
		// Detect whether we need to add extra br's to work around firefox's bugs (also used for webkit)
		ghostedit.browserEngine = ghostedit.util.detectEngines();
		ghostedit.useMozBr = (ghostedit.browserEngine.gecko !== 0 || ghostedit.browserEngine.webkit !== 0 || ghostedit.browserEngine.opera !== 0);
		
		wrapdiv = document.createElement("div");
		wrapdiv.id = "ghostedit_wrap";
		wrapdiv.innerHTML = ghostedit.ui.geteditorchrome();
		placediv.parentNode.insertBefore(wrapdiv, placediv);
		
		// If no preview URL specified, then hide the preview button.
		if (!options.previewurl) document.getElementById("ghostedit_toolbar_button_preview").style.display = 'none';
		
		//Hide div containing original content, and save it and the wrapdiv to global variables
		placediv.style.display = 'none';
		//placediv.parentNode.removeChild(placediv);
		ghostedit.sourceelem = placediv;
		ghostedit.wrapdiv = wrapdiv;
		ghostedit.ui.statusbardiv = document.getElementById("ghostedit_statusbar");
		ghostedit.ui.toolbar.div = document.getElementById("ghostedit_toolbar");
		ghostedit.ui.modal.div = document.getElementById("ghostedit_modal");
		ghostedit.ui.modal.bg = document.getElementById("ghostedit_modalbg");
		
		// If debug mode, initiate logging service and add test button
		if (ghostedit.debug) {
			ghostedit.log.init();
			ghostedit.log.send("init", "A new GhostEdit instance has been started...");
			ghostedit.ui.toolbar.insert.quickbutton("Run tests", "stopwatch16.png", ghostedit.test.runall);
		}
		
		// Register core plugins
		ghostedit.plugins.register("container", "textblock");
		
		// Run plugin init functions, if any
		for (i = 0; i < ghostedit.plugins.list.length; i++) {
			plugin = ghostedit.plugins.list[i];
			
			if (ghostedit[plugin].api && ghostedit[plugin].api.init) {
				ghostedit[plugin].api.init();
			}	
		}
		
		// Import initial content
		ghostedit.editdiv = ghostedit.inout.importHTML(ghostedit.sourceelem);
		ghostedit.wrapdiv.insertBefore(ghostedit.editdiv, ghostedit.ui.statusbardiv);
		
		// Set selection (TODO make it modular)
		lasso().setCaretToStart(ghostedit.dom.getFirstChildGhostBlock(ghostedit.editdiv)).select();
		
		// Make sure that FF uses tags not CSS, and doesn't show resize handles on images
		try{document.execCommand("styleWithCSS", false, false);} catch(err){};//makes FF use tags for contenteditable
		try{document.execCommand("enableObjectResizing", false, false);} catch(err){};//stops resize handles being resizeable in FF
		
		// Save selection & setup undo
		ghostedit.selection.save();
		ghostedit.history.undoData = new Array(40);
		ghostedit.history.undoPoint = 0;
		ghostedit.history.saveUndoState();
		
		// Attach event handlers to document
		htmlelem = document.getElementsByTagName("html")[0];
		ghostedit.util.addEvent(htmlelem, "click", ghostedit.image.unfocus);
		ghostedit.util.addEvent(htmlelem, "mouseup", ghostedit.selection.save);
		ghostedit.util.addEvent(htmlelem, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "drop", ghostedit.util.cancelEvent);
		
		// Attach handlers to editdiv
		ghostedit.util.addEvent(ghostedit.editdiv, "click", ghostedit.selection.save);
		ghostedit.util.addEvent(ghostedit.editdiv, "keyup", ghostedit.selection.save);
		ghostedit.util.addEvent(ghostedit.editdiv, "keydown", function(event) {ghostedit.event.editKeydown(this, event)});
		ghostedit.util.addEvent(ghostedit.editdiv, "keypress", function(event) {ghostedit.event.editKeypress(this, event)});
		ghostedit.util.addEvent(ghostedit.editdiv, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "drop", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "paste", function(event) {ghostedit.paste.handle(this,event)});

		// Attach event handlers to toolbar
		ghostedit.util.addEvent(document.getElementById("ghostedit_toolbar"),"mouseup", function(event) {ghostedit.event.toolbarClick(event)});
		/*// Clear selection (Selection bugs up in Opera)
		lasso().clearSelection();
		ghostedit.selection.save();*/
	},
	
	reset: function() {
		if(ghostedit.active) {
			ghostedit.active = false;
			//ghostedit.sourceelem.innerHTML = ghostedit.inout.exportHTML().full;
			//ghostedit.sourceelem.style.display = 'block';
			ghostedit.wrapdiv.parentNode.removeChild(ghostedit.wrapdiv);
			ghostedit.selection.savedRange = null;
			ghostedit.image.focusedimage = null;
			ghostedit.blockElemId = 0;
			if(ghostedit.options.resetcallback) ghostedit.options.resetcallback();
		}
	},
	
	finish: function() {
		if(ghostedit.active) {
			ghostedit.active = false;
			ghostedit.sourceelem.innerHTML = ghostedit.inout.exportHTML().full;
			ghostedit.wrapdiv.parentNode.removeChild(ghostedit.wrapdiv);
			ghostedit.selection.savedRange = null;
			ghostedit.selection.isvalid = false;
			ghostedit.image.focusedimage = null;
			ghostedit.blockElemId = 0;
			ghostedit.imgElemId = 0;
			ghostedit.sourceelem.style.display = 'block';
			if(ghostedit.options.resetcallback) ghostedit.options.resetcallback();
		}
	},
	
	ui: {
		aelem: false,
		elemInEnglish: { "h1": "Heading 1", "h2": "Heading 2", "h3": "Heading 3", "p": "Paragraph", "div": "Generic Box", "a": "Link", "b": "Bold", "strong": "Bold", "i": "Italic", "em": "Italic",
					   "u": "Underline", "img": "Image", "ul": "Bulletted list", "ol": "Numbered list", "li": "List Item", "strike": "Strikethrough"}, 
		api: {
			update: function () {
				var elem, aelem = false, i, formatboxes, pathstring = "", wordcount = "N/A", textcontent;
				
				
				/* Reset UI elements to non focused state */
				document.getElementById("boldButton").className = "";
				document.getElementById("italicButton").className = "";
				document.getElementById("underlineButton").className = "";
				document.getElementById("strikethroughButton").className = "";
				document.getElementById("alignleftButton").className = "";
				document.getElementById("alignrightButton").className = "";
				document.getElementById("aligncenterButton").className = "";
				document.getElementById("alignjustifyButton").className = "";
				document.getElementById("numberedlistButton").className = "";
				document.getElementById("bulletedlistButton").className = "";
				
				formatboxes = document.getElementById("ghostedit_toolbar_formatboxcontainer").getElementsByTagName("div");
				for(i = 0; i < formatboxes.length; i += 1) {
					ghostedit.util.removeClass(formatboxes[i], "ghostedit_toolbar_formatbox_current");
				}
			
				for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
					node = ghostedit.selection.nodepath[i];
					switch (node.tagName.toLowerCase()) {
						case "b":
						case "strong":
							document.getElementById("boldButton").className = "current";
							break;
						case "i":
						case "em":
							document.getElementById("italicButton").className = "current";
							break;
						case "u":
							document.getElementById("underlineButton").className = "current";
							break;
						case "strike":
							document.getElementById("strikethroughButton").className = "current";
							break;						
						case "a":
							aelem = node;
							break;
						case "ol":
							document.getElementById("numberedlistButton").className = "current";
							break;
						case "ul":
							document.getElementById("bulletedlistButton").className = "current";
							break;
					}
					
					if (node && /textblock/.test(node.getAttribute("data-ghostedit-elemtype")) && ghostedit.selection.typeChangerLookup[node.tagName]) {
						ghostedit.util.addClass(document.getElementById(ghostedit.selection.typeChangerLookup[node.tagName]), "ghostedit_toolbar_formatbox_current")
						document.getElementById('ghostedit_toolbar_clearselect').value = node.style.clear;
						document.getElementById("align" + (node.style.textAlign != "" ? node.style.textAlign : "left") + "Button").className = "current";
					}
					
					if (i !== ghostedit.selection.nodepath.length - 1) { // Don't include editdiv in path
						pathstring = " > " + (ghostedit.ui.elemInEnglish[node.tagName.toLowerCase()] || node.tagName.toUpperCase()) + pathstring;
					}
					
				}
				
				ghostedit.ui.statusbardiv.innerHTML = "<b>Path</b>" + pathstring;
				
				if (ghostedit.options.wordcount) {
					textcontent = ghostedit.util.trim(ghostedit.editdiv.innerText || ghostedit.editdiv.textContent);
					wordcount = textcontent.split(/\s+/).length;
					ghostedit.ui.statusbardiv.innerHTML += "<div style='position: absolute; right: 10px; top: 3px'>" + wordcount + " words</div>";	
				}
				
				
				
				if (aelem) {
					if (aelem != ghostedit.link.focusedlink) {
						ghostedit.link.focus(aelem);
					}
				}
				else if (ghostedit.link.focusedlink) {
					ghostedit.link.unfocus();
				}
			}
		},
		
		modal: {
			div: '',
			bg: '',
			
			show: function (content) {
				ghostedit.ui.modal.div.innerHTML = content + "<a class='ghostedit-modal-closebutton'' onclick='ghostedit.ui.modal.hide()'>&#215;</a>";
				ghostedit.ui.modal.div.style.display = 'block';
				ghostedit.ui.modal.bg.style.display = 'block';
			},
			
			hide: function () {
				ghostedit.ui.modal.div.style.display = 'none';
				ghostedit.ui.modal.bg.style.display = 'none';
				ghostedit.ui.modal.div.innerHTML = "";
				ghostedit.selection.restore();
			},
			
			showabout: function () {
				ghostedit.ui.modal.show("<h2>About GhostEdit</h2>" +
				"<p>GhostEdit is a WYSIWYG editor based on the concept that the editor should be transparent to use - i.e. you do no notice that you are using it. This manifests itself in two ways:</p>" +
				"<ul><li>GhostEdit has an incredibly simple user interface, which is designed for maximum usability</li>" +
				"<li>GhostEdit restricts input to known, safe content so as to be as reliable as possible</li></ul>" + 
				"<h3>Credits</h3>" +
				"GhostEdit was designed and coded by <a href='http://nicoburns.com'>Nico Burns</a>.<br />" +
				"Icons licensed from <a href='http://www.gentleface.com/free_icon_set.html'>Gentleface</a> under a <a href='http://creativecommons.org/licenses/by-nc-nd/3.0/'>CC BY-NC-ND 3.0</a> liscense.");
			}
		},
		
		message: {
			show: function (msg, time, color) {//, bgcolor) {
				//if (typeof bgcolor == "undefined") bgcolor = 'transparent';
				var msgarea = document.getElementById("ghostedit_messagearea");
				msgarea.innerHTML = msg;
				//if (typeof color == "undefined") msgarea.style.color = color;
				color = color == "success" ? "#bbff00" : color;
				color = color == "error" ? "#ff4949" : color;
				color = color == "warn" ? "#ffef49" : color;
				msgarea.style.backgroundColor = color;
				msgarea.style.opacity = 1;
				if (msgarea.filters){ msgarea.filters.item(0).enabled = 1; }
				if (time != 0) {
					clearTimeout(ghostedit.ui.message.timer);
					ghostedit.ui.message.timer = setTimeout(function() { ghostedit.ui.message.clear(); }, time * 1000);
				}
			},
			
			clear: function () {
				var msgarea = document.getElementById("ghostedit_messagearea");
				if (msgarea.style.opacity > 0.1) {
					msgarea.style.opacity = msgarea.style.opacity - 0.05;
					if (msgarea.filters){ msgarea.filters.item(0).Opacity = (msgarea.style.opacity*100); }
					setTimeout(function(){ghostedit.ui.message.clear()},20);
				}
				else {
					msgarea.innerHTML = "&nbsp;";
					msgarea.style.backgroundColor = "transparent";
					msgarea.opacity = "1";
					if (msgarea.filters){ msgarea.filters.item(0).Opacity = 100; }
				}
			}
		},
		
		toolbar: {
			div: "",
			currenttab: "",
			currenttabname: "",
			
			clicktab: function (tab) {
				var panel, tabname, toolbarelems, i, node;
				if (typeof tab === "string") tab = document.getElementById('ghostedit_toolbartab_' + tab.replace('ghostedit_toolbartab_',''));
				tabname = tab.id.replace('ghostedit_toolbartab_','');
				panel = document.getElementById('ghostedit_toolbarpanel_' + tabname);
			
				if (tabname != "image" && tabname != "help") ghostedit.image.unfocus();
				
				if (!ghostedit.image.focusedimage) ghostedit.selection.restore();
				
				ghostedit.ui.toolbar.showtab(tab);
			},
			
			showtab: function (tab) {
				var panel, tabname, toolbarelems, i, node;
				if (typeof tab === "string") tab = document.getElementById('ghostedit_toolbartab_' + tab.replace('ghostedit_toolbartab_',''));
				tabname = tab.id.replace('ghostedit_toolbartab_','');
				panel = document.getElementById('ghostedit_toolbarpanel_' + tabname);
				
				toolbarelems = ghostedit.ui.toolbar.div.childNodes;
				
				for (i = 0; i < toolbarelems.length; i += 1) {
					node = toolbarelems[i];
					if (node.nodeType === 1) {
						if (/tab/.test(node.className) || /panel/.test(node.className)) {
							ghostedit.util.removeClass(node, "active");
						}
					}
				}
				
				ghostedit.util.addClass(tab, "active");
				tab.appendChild(document.getElementById('ghostedit_toolbar_tabselect'));//moves the elem which appears over border-bottom of active tab
				ghostedit.util.addClass(panel, "active");
				
				ghostedit.ui.toolbar.currenttabname = tabname;
			},
			
			enabletab: function (tabname) {
				var tab, panel;
				tab = document.getElementById('ghostedit_toolbartab_' + tabname);
				//panel = document.getElementById('ghostedit_toolbarpanel_' + tabname);
				
				ghostedit.util.addClass(tab, "enabled");
			},
			
			disabletab: function (tabname) {
				var tab, panel;
				tab = document.getElementById('ghostedit_toolbartab_' + tabname);
				//panel = document.getElementById('ghostedit_toolbarpanel_' + tabname);
				
				ghostedit.util.removeClass(tab, "enabled");
			},
			
			insert: {
				quickbutton: function (title, icon, action) {
					var anchor, button;
					if (!icon || !action || !title) return false;
					
					button = document.createElement("img");
					button.className = "ghostedit_toolbar_quickbutton";
					button.src = ghostedit.options.imageroot + icon;
					button.title = button.alt = title;
					
					anchor = document.getElementById("ghostedit_toolbar_quickbutton_insertanchor");
					anchor.parentNode.insertBefore(button, anchor);
					
					button.onclick = action;
				}	
			}
		},
		
		geteditorchrome: function () {
			if(!ghostedit.editorchrome) {
				ghostedit.editorchrome = document.getElementById('ghostedit_editorchrome').innerHTML;
				document.getElementById('ghostedit_editorchrome').parentNode.removeChild(document.getElementById('ghostedit_editorchrome'));
			}
			return ghostedit.editorchrome;
		}
	},
	
		history: {
		undoPoint: 0,
		undoData: new Array(40),
		undoSelectionData: new Array(40),
		
		saveUndoState: function () {
			var tempImg = null, i, j;
			if (ghostedit.image.focusedimage != null) {
				tempImg = ghostedit.image.focusedimage;
				ghostedit.image.unfocus();
			}
			var editwrap = ghostedit.editdiv, i, j, tempArr = new Array(10);
			if (ghostedit.history.undoData[ghostedit.history.undoPoint] != editwrap.innerHTML) {
				tempArr[0] = editwrap.innerHTML;
				j = 1;
				for (i = ghostedit.history.undoPoint; i < ghostedit.history.undoData.length - 1; i += 1) {
					tempArr[j] = ghostedit.history.undoData[i];
					j += 1;
				}
				ghostedit.history.undoData = tempArr;
				ghostedit.history.undoPoint = 0;
			}
			if (tempImg != null) ghostedit.image.focus(tempImg);
		},
		
		undo: function () {
			ghostedit.image.unfocus();
			var undoPoint = ghostedit.history.undoPoint, undoData = ghostedit.history.undoData;
			var editwrap = ghostedit.editdiv,imgs,i;
			if (undoPoint < 39 && undoData[undoPoint+1] !== undefined && undoData[undoPoint+1].length > 0) {
				if (undoPoint == 0) {
					ghostedit.history.saveUndoState();
				}
				if (undoData[undoPoint] == editwrap.innerHTML) {
					undoPoint+=1;
				}
				else {
					ghostedit.history.saveUndoState();
					undoPoint = 1;
				}
				
				ghostedit.history.undoPoint = undoPoint;
				ghostedit.history.undoData = undoData;
				
				editwrap.innerHTML = undoData[undoPoint];
				imgs = editwrap.getElementsByTagName("img");
				for (i=0;i<imgs.length;i+=1)
				{
					imgs[i].onclick = function(event){return ghostedit.image.focus(this,event)};
					imgs[i].ondragstart = function(){return ghostedit.util.cancelEvent()};
					imgs[i].ondraggesture = function(){return ghostedit.util.cancelEvent()};
					imgs[i].onresizestart = function(){return ghostedit.util.cancelEvent()};
				}
				if (document.createRange)
				{
					s = window.getSelection();
					if (s.rangeCount > 0) s.removeAllRanges();
					rang = document.createRange();
					rang.selectNode(editwrap.firstElementChild);
					rang.collapse(true);
					s.addRange(ghostedit.selection.savedRange.getNative());
				}
				else if (document.selection)
				{
					rang = document.body.createTextRange();
					for (i=0;i<editwrap.childNodes.length;i+=i)
					{
					if (editwrap.childNodes[i].nodeType == 1) break;
					}
					rang.moveToElementText(editwrap.childNodes[i]);
					rang.collapse(true);
					rang.select();
				}	
			}
		},
		
		redo: function () {
			ghostedit.image.unfocus();
			var undoPoint = ghostedit.history.undoPoint, undoData = ghostedit.history.undoData;
			var editwrap = ghostedit.editdiv,imgs,i;
			if (undoPoint > 0 && undoData[undoPoint-1] !== undefined && undoData[undoPoint-1].length > 0) {
				undoPoint-=1;
				editwrap.innerHTML = undoData[undoPoint];
				imgs = editwrap.getElementsByTagName("img");
				for (i=0;i<imgs.length;i+=1) {
					imgs[i].onclick = function(event){return imageFocus(this,event)};
					imgs[i].ondragstart = function(){return cancelEvent()};
					imgs[i].ondraggesture = function(){return cancelEvent()};
					imgs[i].onresizestart = function(){return cancelEvent()};
				}
			}
			
			ghostedit.history.undoPoint = undoPoint;
			ghostedit.history.undoData = undoData;
			
			if (document.createRange) {
				s = window.getSelection();
				if (s.rangeCount > 0) s.removeAllRanges();
				rang = document.createRange();
				rang.selectNode(editwrap.firstElementChild);
				rang.collapse(true);
				s.addRange(ghostedit.selection.savedRange);
			}
			else if (document.selection) {
				rang = document.body.createTextRange();
				for (i=0;i<editwrap.childNodes.length;i+=i) {
					if (editwrap.childNodes[i].nodeType == 1) break;
				}
				rang.moveToElementText(editwrap.childNodes[i]);
				rang.collapse(true);
				rang.select();
			}
		}
	},
	
	paste: {
		savedcontent: null,
		savedundodata: null,
		savedundopoint: null,
		beforerangedata: "",
		afterrangedata: "",
		waitlength: 0,
		
		handle: function (elem,e) {//elem no longer used?
			var pastedData, tempElem, s, range, r1;				
			ghostedit.history.saveUndoState();
			ghostedit.paste.savedundodata = ghostedit.history.undoData;
			ghostedit.paste.savedundopoint = ghostedit.history.undoPoint;
			
			ghostedit.event.deleteSelectionContents()
			ghostedit.selection.save();
			pastedData = false;
			
			/* Try to get clipboard data beforepaste (disabled as we now process data after paste in all browsers)
			if (window.clipboardData) {
				try {
					pastedData = window.clipboardData.getData('Text');
					window.clipboardData.clearData('URL');
					window.clipboardData.clearData('File');
					//window.clipboardData.clearData('HTML');
					window.clipboardData.clearData('Image');
				}
				catch(e) {
					pastedData = false;
				}
			}
			else if (e.clipboardData && e.clipboardData.getData) {
				try{
					pastedData = e.clipboardData.getData('text/html');
				}
				catch(e){
					pastedData = false;
				}
			}*/
			//alert(pastedData);
			
			elem = ghostedit.selection.getStarttextblockNode();
			elemid = elem.id.toString();
			if(document.createRange) {
				ghostedit.paste.afterrangedata = ghostedit.selection.savedRange.clone().setEndToRangeEnd(lasso().setCaretToEnd(elem)).extractHTML();
			}
			else if (document.selection) {
				ghostedit.selection.savedRange.bookmarkify();
				range = lasso().setCaretToEnd(elem);
				ghostedit.paste.afterrangedata = ghostedit.selection.savedRange.unbookmarkify().clone().setEndToRangeEnd(range).extractHTML();
			}
			ghostedit.paste.savedcontent = ghostedit.util.extractContent(ghostedit.editdiv);//ghostedit.editdiv.innerHTML;
			ghostedit.paste.triedpasteimage = false;
			if (e.clipboardData && e.clipboardData.getData) {// Webkit - get data from clipboard, put into editdiv, cleanup, then cancel event
				if (/image/.test(e.clipboardData.types)) {
					ghostedit.paste.triedpasteimage = true;
				}
				
				//alert(e.clipboardData.types);
				if (/text\/html/.test(e.clipboardData.types)) {
					ghostedit.editdiv.innerHTML = e.clipboardData.getData('text/html');
				}
				else if (/text\/plain/.test(e.clipboardData.types)) {
					ghostedit.editdiv.innerHTML = e.clipboardData.getData('text/plain');
				}
				else {
					ghostedit.editdiv.innerHTML = "";
				}
				ghostedit.paste.waitfordata(elemid, elem.tagName.toLowerCase());
				return ghostedit.util.cancelEvent(e);
			}
			else {// Everything else - empty editdiv and allow browser to paste content into it, then cleanup
				ghostedit.editdiv.innerHTML = "";
				ghostedit.paste.waitfordata(elemid, elem.tagName.toLowerCase());
				return true;
			}
		},
		
		waitfordata: function (caretelemid, caretelemtype) {
			var elem = ghostedit.editdiv;
			if (elem.childNodes && elem.childNodes.length > 0) {
				ghostedit.paste.process(caretelemid, caretelemtype);
			}
			else {
				that = {
					i: caretelemid,
					e: caretelemtype
				}
				that.callself = function () {
					ghostedit.paste.waitfordata(that.i, that.e)
				}
				setTimeout(that.callself,20);
			}
		},
		
		isheader: function (elemtype) {
			switch (elemtype) {
				case "h1":
				case "h2":
				case "h3":
				case "h4":
				case "h5":
				case "h6":
					return true;
				default:
					return false;
			}
		},
		
		//Process pasted data
		process: function (caretelemid, caretelemtype) {
			var elem, elems, caretelemtype, isfirstelem, i, j, currentelem, currentelemtype, subelem, appenddata = "";
			var newelems, nodetagtype, nodelist = "", insertelem, previnsertelem, nextelem, tempelem, images;
			
			//caretelemtype = ghostedit.paste.isheader(caretelemtype) ? "h" : caretelemtype;
			isfirstelem = true;
			
			elem = ghostedit.editdiv;
			elem.innerHTML = ghostedit.util.strip_tags(elem.innerHTML,"<" + ghostedit.allowedtags.join("><") + ">");
			newelems = [];
			j = -1;
			
			pastednodes = elem.childNodes;
			/*for(i = 0; i < pastednodes.length ; i += 1){
				if (pastednodes[i].nodeType === 3) {
					nodelist += "Text Node:\n" + pastednodes[i].nodeValue + "\n";
				}
				else if (pastednodes[i].nodeType === 1) {
					nodelist += pastednodes[i].tagName + " Node:\n" + pastednodes[i].innerHTML + "\n";
				}
			}
			alert(nodelist);*/
			
			for(i = 0; i < pastednodes.length ; i += 1){
				if (pastednodes[i].nodeType === 3) {
					if (isfirstelem === true) {
						appenddata += pastednodes[i].nodeValue;
					}
					else {
						newelems[j].html += pastednodes[i].nodeValue;
					}
				}
				else if (pastednodes[i].nodeType === 1) {
					nodetagtype = pastednodes[i].tagName.toLowerCase();
					switch (nodetagtype) {
						case "img":
							triedpasteimage = true;
							break;
						case "br":
							if (isfirstelem === true ) {
								appenddata += "<br />";
							}
							else {
								newelems[j].html += "<br />";
							}
							break;
						case "a":
						case "b":
						case "i":
						case "strong":
						case "em":
						case "u":
						case "strike":
							if (isfirstelem === true ) {
								appenddata += "<" + nodetagtype + ">" + pastednodes[i].innerHTML + "</" + nodetagtype + ">";
							}
							else {
								newelems[j].html += "<" + nodetagtype + ">" + pastednodes[i].innerHTML + "</" + nodetagtype + ">";
							}
							break;
						case caretelemtype:
							if (isfirstelem === true ) {
								appenddata += pastednodes[i].innerHTML;
								break;
							}
						default:
							if (ghostedit.paste.isheader(nodetagtype) || nodetagtype === "p") {
								j++;
								newelems[j] = {};
								newelems[j].tagtype = nodetagtype;
								newelems[j].html = pastednodes[i].innerHTML;
							}
							isfirstelem = false;
					}
				}
			}
			
			//ghostedit.editdiv.innerHTML = ghostedit.paste.savedcontent;
			ghostedit.editdiv.innerHTML = "";
			ghostedit.editdiv.appendChild(ghostedit.paste.savedcontent);
			caretelem = document.getElementById(caretelemid);
			
			// Restore image event handlers
			images = ghostedit.editdiv.getElementsByTagName("img");
			for(i = 0; i < images.length; i += 1) {
				images[i].onclick = function(e){ghostedit.image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
				images[i].ondragstart = function(event){
					event = window.event ? window.event : event;
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData("Text", images[i].id);
					}
					return true;
				};
				images[i].ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
				images[i].onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
				images[i].oncontrolselect = function(e){ghostedit.image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
			}
			
			/* prepend last elem to elem after if same type (undesired behaviour)
			nextelem = false;
			tempelem = caretelem;
			while (tempelem.nextSibling) {
				tempelem = tempelem.nextSibling;
				if (tempelem.nodeType === 1 && tempelem.getAttribute("data-ghostedit-elemtype") == "textblock") {
					nextelem = tempelem;
					break;
				}
				else if (tempelem.nodeType === 1 && tempelem.tagName.toLowerCase() === "img") {
					break;
				}						
			}
			
			if (j > -1) {
				if (ghostedit.paste.afterrangedata.length > 0) {
					if(newelems[j].tagtype === caretelemtype) {
						newelems[j].html += ghostedit.paste.afterrangedata;
					}
					else {
						j++;
						newelems[j] = {};
						newelems[j].tagtype = caretelemtype;
						newelems[j].html = ghostedit.paste.afterrangedata;
					}
				}
				else {
					if (nextelem && nextelem.tagName.toLowerCase() === newelems[j].tagtype) {
						nextelem.innerHTML = newelems[j].html + nextelem.innerHTML;
						newelems.pop();
						j--;
					}
				}
			}*/
			if (j > -1 && ghostedit.paste.afterrangedata.length > 0) {
				if(newelems[j].tagtype === caretelemtype) {
					newelems[j].html += ghostedit.paste.afterrangedata;
				}
				else {
					j++;
					newelems[j] = {};
					newelems[j].tagtype = caretelemtype;
					newelems[j].html = ghostedit.paste.afterrangedata;
				}
			}
			
			lasso().setCaretToEnd(caretelem).select();
			
			/* DEBUG INFO
			for(i = 0; i < newelems.length ; i += 1){
				nodelist += newelems[i].tagtype + " Node:\n" + newelems[i].html + "\n";
			}
			//alert(nodelist);*/
			
			
			insertelem = caretelem;
			for(i = 0; i < newelems.length; i += 1) {
				previnsertelem = insertelem;
				insertId = ghostedit.textblock.insert(insertelem, newelems[i].tagtype);
				insertelem = document.getElementById("ghostedit_textblock_" + insertId);
				//alert(insertelem.id + "\n" + newelems[i].html + "\n");
				insertelem.innerHTML = newelems[i].html;
				lasso().setCaretToEnd(insertelem).select();
				/* (NOT NEEDED?) works around FF not picking up _moz_dirty via innerHTML
				if (insertelem.getElementsByClassName != null && document.createRange) {
					elems = insertelem.getElementsByClassName("moz_dirty");
					for (j = 0; j < elems.length; j += 1) {
						elems[j].setAttribute("_moz_dirty","");
					}
				}*/
			}
			
			if (j > -1) {
				caretelem.innerHTML += appenddata;
				lasso().setCaretToEnd(previnsertelem).select();
			}
			else {
				caretelem.innerHTML += appenddata + "<span id='ghostedit_marker'>&#x200b;</span>" + ghostedit.paste.afterrangedata;
				lasso().selectNode('ghostedit_marker').deleteContents().select();
			}
			
			ghostedit.selection.save();
			ghostedit.history.undoData = ghostedit.paste.savedundodata;
			ghostedit.history.undoPoint = ghostedit.paste.savedundopoint;
			ghostedit.history.saveUndoState();
			
			if (ghostedit.paste.triedpasteimage) {
				ghostedit.ui.message.show("You cannot paste images into the editor, please use the add image button instead", 2, "warn");
			}
		}
	},
	
	container: {
		
		ghostevent: function (type, block, sourcedirection, params) {
		var docall = false, blocktype, eventhandled = false;
			switch (type) {
				case "deletebehind":
					childblocks = block.childNodes;
					for(i = childblocks.length - 1; i >= 0; i -= 1) {
						if (childblocks[i].getAttribute("data-ghostedit-elemtype") !== undefined && childblocks[i].getAttribute("data-ghostedit-elemtype") !== false && childblocks[i].getAttribute("data-ghostedit-elemtype") !== null) {
							if (docall === true) {
								blocktype = childblocks[i].getAttribute("data-ghostedit-elemtype");
								if(ghostedit[blocktype].ghostevent("deletefromahead", childblocks[i], params)) {
									eventhandled = true;
									break;
								}
							}
							else if (childblocks[i] === params.sourceblock) {
								docall = true;
							}
						}
					}
					
					if (!eventhandled) {
						// No child elements behind element that accepted delete
						// Do nothing because container doesn't allow deletes behind it
					}
				break;
				case "deleteahead":
					childblocks = block.childNodes;
					for(i = 0; i < childblocks.length; i += 1) {
						if (childblocks[i].getAttribute("data-ghostedit-elemtype") !== undefined && childblocks[i].getAttribute("data-ghostedit-elemtype") !== false && childblocks[i].getAttribute("data-ghostedit-elemtype") !== null) {
							if (docall === true) {
								blocktype = childblocks[i].getAttribute("data-ghostedit-elemtype");
								if(ghostedit[blocktype].ghostevent("deletefrombehind", childblocks[i], params)) {
									eventhandled = true;
									break;
								}
							}
							else if (childblocks[i] === params.sourceblock) {
								docall = true;
							}
						}
					}
					
					if (!eventhandled) {
						// No child elements behind element that accepted delete
						// Do nothing because container doesn't allow deletes behind it
					}
				break;
			}		
			
		},
		
		api: {
			init: function () {
				ghostedit.inout.registerimportcapability ("container", "div");
				return true;
			},
			importHTML: function (sourcenode) {
				var container, handler, result, i;
				if (!sourcenode || sourcenode.childNodes.length < 1) return false;
				
				container = ghostedit.container.create();
				
				// For each source child node, check if appropriate import handler exists, if so then call it on the node
				for (i = 0; i < sourcenode.childNodes.length; i += 1) {
					elem = sourcenode.childNodes[i];
					if (elem.nodeType !== 1)  continue;
					
					tagname = elem.tagName.toLowerCase();
					if (handler = ghostedit.inout.importhandlers[tagname]) {
						result = ghostedit[handler].api.importHTML(elem)
						if (result && ghostedit.dom.isGhostBlock(result)) {
							container.appendChild(result);
						}
					}
				}
				
				// Check any GhostBlock children have been added, else add empty paragraph
				if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
					container.appendChild(ghostedit.textblock.create("p"));
				}
				
				ghostedit.log.send("containter-import", "A container was imported.");
				return container;
			},
			
			exportHTML: function (target, includeself) { // Shouldn't be used without first using export prepare functions
				if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "container") return false;
				var i = 0, elem, code, finalCode = "", params, handleResult, blockcount = 0, snippet, handler, isrootnode = false;
				
				//if (target.getAttribute("data-ghostedit-isrootnode") === true) isrootnode = true;
				
				// Allows for inclusion of enclosing <div> if wanted in future, may also want to retreieve properties
				//if (includeself === true) finalCode =+ "<div>";
				
				for (i = 0; i < target.childNodes.length; i += 1) {
					elem = ghostedit.dom.isGhostBlock( target.childNodes[i] ) ? target.childNodes[i] : false;
					if (!elem) continue;
					
					handler = elem.getAttribute("data-ghostedit-handler");
					if (!handler || !ghostedit[handler]) continue;
					
					blockreturn = ghostedit[handler].api.exportHTML(elem);
					
					if (blockreturn) {
						finalCode += blockreturn.content;
						blockcount ++;
					}
					
					//Create snippet from first 3 paragraphs
					if (blockcount <= 3){
						snippet = finalCode;
					}
				}
				
				return {content: finalCode, snippet: snippet};
			},
		
			addchild: function (target, wheretoinsert, anchorelem, newElem) {
				ghostedit.history.saveUndoState();
				
				if (wheretoinsert === "before") {
					target.insertBefore(newElem, anchorelem);
				}
				else {
					if (anchorelem.nextSibling != null) {
						target.insertBefore(newElem, anchorelem.nextSibling);
					}
					else {
						target.appendChild(newElem);
					}
				}
				
				ghostedit.log.send("container-addchild", "The container " + target.id + " added a child GhostBlock");
				ghostedit.history.saveUndoState();
				return true;
			},
			
			removechild: function (target, child) {
				if (!target || !child) return false;
				ghostedit.history.saveUndoState();
				
				target.removeChild(child);
				
				ghostedit.history.saveUndoState();
				return true;
			}
		},
		
		create: function () {
			// Create element, and assign id and content
			newElem = document.createElement("div");
			ghostedit.blockElemId += 1;
			newElem.id = "ghostedit_container_" + ghostedit.blockElemId;
			
			// Set GhostEdit handler attributes
			newElem.setAttribute("data-ghostedit-iselem", "true");
			newElem.setAttribute("data-ghostedit-elemtype", "container");
			newElem.setAttribute("data-ghostedit-handler", "container");
			
			ghostedit.log.send ("container-create", "A new container was created.");
			return newElem;
		},
		
		deleteSelectionContents: function (container) {
			var startelem, endelem, startblock, endblock, childblocks, sametagtype, savedcontent, range, savedrange, dodelete, r1, r2, b1, b2, firsttextblocktype, dummynode, insertId, insertedelem;
			
			var startofblock, endofblock, selrange, atverystart = false, atveryend = false, firstchildblock, lastchildblock, condition, childblocktype, status, message, handler, block;
			
			// Temporary selection range to avoid changing actual saved range
			selrange = ghostedit.selection.savedRange;
			
			// Get first and last child ghostblock
			childblocks = container.childNodes;
			
			for(i = 0; i < childblocks.length; i += 1) {
				if (ghostedit.dom.isGhostBlock(childblocks[i])) {
					firstchildblock = childblocks[i];
					break;
				}
			}
			
			for(i = childblocks.length - 1; i >= 0; i -= 1) {
				if (ghostedit.dom.isGhostBlock(childblocks[i])) {
					lastchildblock= childblocks[i];
					break;
				}
			}
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(firstchildblock);
			endofblock = lasso().setCaretToEnd(lastchildblock);
			
			// If selrange starts before or at block, set startblock to the first child ghostblock
			if (selrange.compareEndPoints("StartToStart", startofblock) !== 1) {
				atverystart = true;
				startblock = firstchildblock;
			}
			// Otherwise, set child ghostblock containing the start of the selection
			else {
				condition = ghostedit.container.isChildGhostblock;
				startblock = ghostedit.selection.getCertainParent(condition, selrange.getStartNode(), childblocks);
			}
			
			// If selrange ends after or at block, set endblock to the last child ghostblock
			if (selrange.compareEndPoints("EndToEnd", endofblock) !== -1) {
				atveryend = true;
				endblock = lastchildblock;
			}
			// Otherwise, set child ghostblock containing the end of the selection
			else {
				condition = ghostedit.container.isChildGhostblock;
				endblock = ghostedit.selection.getCertainParent(condition, selrange.getEndNode(), childblocks);
			}
			
			//alert(startblock.id + endblock.id);
					
			
			/*//Handle selectall case
			if (isatverystart && isatveryend) {
				dodelete = false;
				firsttextblocktype = textblockelems[i].tagName.toLowerCase();
				for(i = 0; i < childblocks.length; i += 1) {
					if (childblocks[i].getAttribute("data-ghostedit-elemtype") !== undefined && childblocks[i].getAttribute("data-ghostedit-elemtype") !== false) {
						firstchildblock = childblocks[i];
						break;
					}
				}
				lasso().setCaretToStart(firstchildblock).select();
				return true;
			}*/
			
			//ghostedit.textblock.deleteSelectionContents(lastchildblock);
			
			//alert("start - " + startblock.id + "\nend - " + endblock.id);
			
			// Cycle through SELECTED child ghostblocks and call delete method
			dodelete = false;
			for(i = 0; i < childblocks.length; i += 1) {
				
				cblock = childblocks[i];
				if ( !ghostedit.dom.isGhostBlock(cblock) ) continue;
				handler = cblock.getAttribute("data-ghostedit-handler");
				
				if (cblock.id === startblock.id) {
					ghostedit[handler].deleteSelectionContents( cblock );
					dodelete = true;
					continue;
				}
				else if (cblock.id === endblock.id) {
					ghostedit[handler].deleteSelectionContents( cblock );
					dodelete = false;
					break;
				}
				
				if (dodelete) {
					container.removeChild(childblocks[i]);
					i--;
				}
					
			}
			
			// If the first and last elements in the selection are the same type, then merge
			if(startblock.getAttribute("data-ghostedit-elemtype") === endblock.getAttribute("data-ghostedit-elemtype")) {
				ghostedit[startblock.getAttribute("data-ghostedit-elemtype")].merge(startblock, endblock);
			}
			
			if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
				/*ghostedit.editdiv.innerHTML = "<div id='ghostedit_dummynode' data-ghostedit-elemtype='textblock'>Loading content...</div>";
				dummynode = document.getElementById('ghostedit_dummynode');
				lasso().selectNodeContents(dummynode).select();*/
				container.appendChild(ghostedit.textblock.create("p"));
			}
			
			// Place caret where the selection was
			//lasso().setCaretToStart(endelem).select();

			return true;
		},
		
		isChildGhostblock: function (elem, childblocks) {
			//alert(arguments.length);
			if (!elem) return false;
			if (elem.nodeType != 1) return false;
			if (elem.getAttribute("data-ghostedit-elemtype") === undefined) return false;
			if (elem.getAttribute("data-ghostedit-elemtype") === false) return false;
			if (elem.getAttribute("data-ghostedit-elemtype") === null) return false;
			for(i = 0; i < childblocks.length; i += 1) {
				if (elem === childblocks[i]) {
					return true;
				}
			}
			return false;
		}
	},
	
	textblock: {
		create: function (elemtype, content, id) {
			var newElem;
			
			// If explicit id not passed, get next blockElemId
			if (!id) {
				ghostedit.blockElemId += 1;
				id = 'ghostedit_textblock_' + ghostedit.blockElemId;
			}
			
			// If no content sent, set to default content of ""      ---"Edit Here!"
			content = (content && content.length && content.length > 0) ? content : "";//"Edit Here!";
			
			// Create element, and assign id and content
			newElem = document.createElement(elemtype);
			newElem.id = id;
			newElem.innerHTML = content;
			
			// Set GhostEdit handler attributes
			newElem.setAttribute("data-ghostedit-iselem", "true");
			newElem.setAttribute("data-ghostedit-elemtype", "textblock");
			newElem.setAttribute("data-ghostedit-handler", "textblock");
			
			// Add event handlers
			newElem.ondragenter = function(){return false;};
			newElem.ondragleave = function(){return false;};
			newElem.ondragover = function(){return false;};
			newElem.ondrop = function(e){
				// This function does basic image paragraph changing dnd
				elemid = e.dataTransfer.getData("Text") || e.srcElement.id;
				//alert(elemid); TODO drag drop
				elem = document.getElementById(elemid);
				elem.parentNode.insertBefore(elem,this);
				ghostedit.image.focus(elem);
				};
			newElem.onresizestart = function(e) {return ghostedit.util.cancelEvent(e);};
			
			// Tidy MozBr's in new element
			ghostedit.textblock.mozBrs.tidy(newElem);
			
			ghostedit.log.send ("textblock-create", "A new textblock was created.");
			
			return newElem;
		},
		insert: function (elem, elemtype, explicitId, whereToInsert, savedElemContent) { // LEGACY FUNCTION
			var brNode, fNode, appendBr, s, range, beforerangedata, rangedata, afterrangedata, savedElemContent, elemid, newElem, dummyE, savedrange, parent, handler, result;
			ghostedit.history.saveUndoState();
			ghostedit.selection.save();
			ghostedit.log.send ("textblock-insert", "A new textblock was inserted.");
			
			if (whereToInsert !== "before") { whereToInsert = "after"; }
			if (!savedElemContent) savedElemContent = "";
			
			// Create new element for inserting
			newElem = ghostedit.textblock.create(elemtype, savedElemContent, explicitId);
			
			// Ask (ghost) parent to insert new element into page
			parent = ghostedit.dom.getParentGhostBlock(elem);
			handler = parent.getAttribute("data-ghostedit-handler");

			result = ghostedit[handler].api.addchild (parent, whereToInsert, elem, newElem, {"contentlength": savedElemContent.length});
			
			if (!result) return false;
			
			
			/*Append saved content to new element
			if (savedElemContent != "") newElem.innerHTML = savedElemContent;
			else lasso().selectNode(newElem).select().deleteContents();
			newElem.focus(); 
			
			
			lasso().selectNode(newElem);// should be '.select();'? but redundant line anyway?
			newElem.innerHTML = savedElemContent;*/
			
			
			// Tidy MozBr's in new element
			ghostedit.textblock.mozBrs.tidy(newElem);
			
			// Set caret to start of new element
			if(whereToInsert === "before") {
				lasso().selectNodeContents(elem).collapseToStart().select();
			}
			else {
				lasso().selectNodeContents(newElem).collapseToStart().select();
			}

			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			return ghostedit.blockElemId;
		},
		
		remove: function (textblockelem) {
			var savedElemContent, editdiv, focuselem, i, thisone, s, range, offsetLeft, offsetTop, brNode;

			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			
			// If textblock elem still contains content, save to variable for appending to previous textblock elem
			savedElemContent = "";
			//if(ghostedit.textblock.isEmpty(textblockelem) !== true) {
					savedElemContent = textblockelem.innerHTML;
			//}
			
			// Cycle through textblock elements backwards to select the one before the current one to focus
			editdiv = ghostedit.editdiv;
			textblockelems = editdiv.getElementsByTagName("*");
			thisone = false;
			for(i = textblockelems.length - 1; i >= 0; i -= 1) {
				if (thisone === true && textblockelems[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
					focuselem = textblockelems[i];
					break;
				}
				else if (textblockelems[i] === textblockelem) {
					thisone = true;
				}
			}
			
			// If focuselem is empty, delete it instead (intuitive behaviour)
			if (ghostedit.textblock.isEmpty(focuselem)) {
				editdiv.removeChild(focuselem);
				
				lasso().setCaretToStart(textblockelem).select();
				
				ghostedit.selection.save();
				ghostedit.history.saveUndoState();
				return;
			}
			
			
			// Remove textblock elem
			editdiv.removeChild(textblockelem);
			
			// Set caret to end of focuselem
			lasso().setCaretToEnd(focuselem).select();
			ghostedit.selection.save();
			
			// Add saved content
			focuselem.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + savedElemContent;
			
			// Sort out MozBr's (one at very end of elements, that's it)
			ghostedit.textblock.mozBrs.tidy(focuselem);
			
			// Place caret in correct place
			lasso().selectNode('ghostedit_marker').deleteContents().select();
			if (document.getElementById('ghostedit_marker')) {
				document.getElementById('ghostedit_marker').parentNode.removeChild(document.getElementById('ghostedit_marker'));
			}
			

			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
		},
		
		mozBrs: {		
			checkifcontains: function (node) {
				var elements, i;
				elements = node.getElementsByTagName("br");
				
				for(i = 0; i < elements.length; i += 1) {
					if(elements[i].MozDirty !== undefined) return true;
				}
				
				return false;
			},
			
			insert: function (elem) {
				var brNode;
				brNode = document.createElement("br");
				brNode.setAttribute("_moz_dirty", "");
				brNode.className = "moz_dirty";
				elem.appendChild(brNode);
			},
			
			clear: function (node) {
				var elements, i;
				elements = node.getElementsByTagName("br");
				
				for(i = 0; i < elements.length; i += 1) {
					if(elements[i].MozDirty !== undefined || /moz_dirty/.test(elements[i].className)) {
						elements[i].parentNode.removeChild(elements[i]);
						i--; //One less element in live list, so decrease iterator
					} 
				}
			},
			
			tidy: function (elem) {
				ghostedit.textblock.mozBrs.clear(elem);
				if(ghostedit.useMozBr) {
					ghostedit.textblock.mozBrs.insert(elem);
				}
			}
			
		},
		
		api: {
			
			init: function () {
				ghostedit.inout.registerimportcapability ("textblock", "p", "h1", "h2", "h3", "h4", "h5", "h6");
				return true;
			},
			
			query: function (query){
				args = [].slice.call(arguments);
				args.shift();
				switch (query) {
					case "acceptcaret":
						return true;
						break;
					case "acceptcontentoftype":
						var type = args[0];
						break;
					default:
						return false;
				}
			},
			
			importHTML: function (source) {
				var newTextBlock, tagname;
				
				// Create TextBlock
				tagname = source.tagName.toLowerCase();
				newTextBlock = ghostedit.textblock.create(tagname, source.innerHTML);
				
				// Apply source class to new TextBlock
				if (source.className.length > 0 && !/ghostedit/.test(source.className)) {
					newTextBlock.className = source.className;
				}
				
				// Apply source text-align to new TextBlock
				if (source.style.textAlign != "") {
					newTextBlock.style.textAlign = source.style.textAlign;
				}
				
				//Apply source 'clear' to new TextBlock
				if (source.style.clear != "") {
					newTextBlock.style.clear = source.style.clear;
				}
				
				ghostedit.textblock.mozBrs.tidy (newTextBlock);
				
				ghostedit.log.send ("textblock-import","Textblock imported.");
				return newTextBlock;
			},
			
			exportHTML: function (target) {
				if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;	
				var finalCode = "", stylecode = "", elem;
				elem = target;
				
				ghostedit.textblock.mozBrs.clear(elem);
		
				//if(elem.tagName.toLowerCase() == "p") paracount++;
				
				
				finalCode += "<" + elem.tagName.toLowerCase();
				
				// Extract styles
				if (elem.style.textAlign != "") { stylecode += "text-align:" + elem.style.textAlign + ";"; }
				if (elem.style.clear != "") stylecode += "clear:" + elem.style.clear + ";";
				
				if (stylecode.length > 0) finalCode += " style='" + stylecode + "'";
				
				// Extract class
				if (elem.className.length > 0 && !/ghostedit/.test(elem.className)) finalCode += " class='" + elem.className + "'";
				
				finalCode += ">";
				
				// Copy content and end tag
				finalCode += elem.innerHTML;
				finalCode += "</" + elem.tagName.toLowerCase() + ">";
				
				ghostedit.textblock.mozBrs.tidy(elem);
				
				return {content: finalCode};
			},
			
			event: {
				keypress: function (keycode, e) {
					switch (keycode) {
						case 8: // backspace
							return ghostedit.textblock.backspacePress(e);
							break;	
					}
				}
			}
		},
		
		gevent: {
			textdelete: function (target, sourcedirection, params){
				var parent, handler;
				switch (sourcedirection) {
					case "ahead":
						if (!ghostedit.textblock.isEmpty(target)) {
							target.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>";
							if (params.merge && params.merge.sourcecontent && (params.merge.contenttype === "inlinehtml" || params.merge.contenttype === "text")) {
								target.innerHTML += params.merge.sourcecontent;
							}
							ghostedit.textblock.mozBrs.tidy(target);
							params.merge.callback();
							//params.sourceblock.parentNode.removeChild(params.sourceblock);
							lasso().selectNode("ghostedit_marker").select()//.deleteContents();
							document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
						}
						else {
							parent = ghostedit.dom.getParentGhostBlock(target);
							handler = parent.getAttribute("data-ghostedit-handler");
							//alert(target.id);
							ghostedit[handler].api.removechild(parent, target);
						}
						return true;
					break;
					case "behind":
						var block = ghostedit.selection.getContainingGhostBlock();
						var params =  {
							"merge": {
								"contenttype": "inlinehtml",
								"sourcecontent": target.innerHTML,
								"callback": ghostedit.util.preparefunction(function (node) {node.parentNode.removeChild(node)}, false, target)
							}
						}
						ghostedit.event.sendBackwards("delete", target, params);
						//----------------------------------
						//ghostedit.textblock.remove(ghostedit.selection.getStarttextblockNode());
						
						//ghostedit.event.cancelKeypress = true;
						//return ghostedit.util.cancelEvent ( e );
						return true;
					break;
				}
			}
		},
		
		ghostevent: function (eventtype, target, sourcedirection, params) {
			var docall = false, blocktype, eventhandled = false;
			switch (eventtype) {
				case "delete":
					return ghostedit.textblock.gevent.textdelete (target, sourcedirection, params);
				break;	
				case "keydown":
					switch (params.keycode) {
						case 8: // backspace
							return ghostedit.textblock.event.backspace(target, params.event);
						break;
						case 46: //delete
							return ghostedit.textblock.event.deletekey (target, params.event);
						break;
					}
				break;
				case "keypress":
					switch (params.keycode) {
						case 13: // enter
							return ghostedit.textblock.event.enterkey (target, params.event);
						break;
					}
				break;
			}
			
		},
		
		event: {
			backspace: function (block, e) {
				if (ghostedit.selection.isAtStartOftextblock() !== true) {
					//Caret not at start of textblock: return true to indicate handled
					return true;
				}
				else {
					//var block = ghostedit.selection.getContainingGhostBlock();
					var params =  {
						"merge": {
							"contenttype": "inlinehtml",
							"sourcecontent": block.innerHTML,
							callback: ghostedit.util.preparefunction(function (node) {
								var parent = node.parentNode;
								var handler = parent.getAttribute("data-ghostedit-handler");
								ghostedit[handler].api.removechild(parent, node);}, false, block)
						}
					}
					ghostedit.event.sendBackwards("delete", block, params );
					//ghostedit.textblock.remove(ghostedit.selection.getStarttextblockNode());
					ghostedit.event.cancelKeypress = true;
					ghostedit.util.cancelEvent ( e );
					return true;
				}
			},
			
			deletekey: function (block, e) {
				//var block = ghostedit.selection.getContainingGhostBlock();
				if (ghostedit.selection.isAtEndOftextblock() !== true) {
					//Caret not at end of textblock: return true to indicate handled
					return true;
				}
				else {
					ghostedit.event.sendForwards("delete", block);
					//ghostedit.textblock.remove(ghostedit.selection.getStarttextblockNode());
					ghostedit.event.cancelKeypress = true;
					ghostedit.util.cancelEvent ( e );
					return true;
				}
			},
			
			enterkey: function (elem, e) {
				ghostedit.log.send ("textblock-event-enterkey", "The textblock enterkey handling function was called.");
				if (e.shiftKey) {
					ghostedit.format.insert.br();
					ghostedit.textblock.mozBrs.tidy (elem);
					ghostedit.util.cancelEvent ( e );
					return true;
				}
				else {
					ghostedit.selection.save();
					var wheretoinsert, atstart, atend, elemtype, savedElemContent, range, result, newTextBlock, parent, handler;
					
					atstart = (ghostedit.selection.isAtStartOftextblock() === true) ? true : false;
					atend = (ghostedit.selection.isAtEndOftextblock() === true) ? true : false;
					wheretoinsert = (atstart && !atend) ? "before" : "after";
					elemtype = (wheretoinsert == "before" || atend) ? "p" : ghostedit.selection.getStarttextblockNode().tagName;
					
					//alert("atstart - " + atstart+ "\natend - " + atend + "\nwhere - " + wheretoinsert);
					
					// Tidy MozBr's in original element
					ghostedit.textblock.mozBrs.tidy(elem);
					
					// Save and the delete the content after the caret from the original element
					if(!atstart && !atend) {//wheretoinsert === "after") {
						if (document.createRange) {
							range = lasso().selectNodeContents( elem ).setStartToRangeStart(ghostedit.selection.savedRange); // Odd bug (at least in chrome) where savedRange is already to the end.
							savedElemContent = range.getHTML();
							range.deleteContents();
						}
						else if (document.selection) {		
							// Bookmark lines allow innerHTML to be modified as long as it is put back to how it was
							/*savedrange = ghostedit.selection.savedRange.getNative().getBookmark();
							range = lasso().selectNodeContents( elem );
							ghostedit.selection.savedRange.getNative().moveToBookmark(savedrange);
							range.getNative().setEndPoint("StartToEnd", ghostedit.selection.savedRange.getNative());*/
							range = lasso().selectNode(elem);
							range.setStartToRangeEnd(ghostedit.selection.savedRange);
							savedElemContent = range.getHTML();
							range.getNative().text = "";
						}
					}
					else {
						savedElemContent = "";
					}
					
					/*result = ghostedit.textblock.insert(elem, elemtype, false, wheretoinsert, savedElemContent); */
					
					// Create new element for inserting
					newTextBlock = ghostedit.textblock.create(elemtype, savedElemContent);
					if (!newTextBlock) return false;
					
					// Ask (ghost) parent to insert new element into page
					parent = ghostedit.dom.getParentGhostBlock(elem);
					handler = parent.getAttribute("data-ghostedit-handler");
					result = ghostedit[handler].api.addchild (parent, wheretoinsert, elem, newTextBlock, {"contentlength": savedElemContent.length});
					
					if (!result) return false;
					/* IF !result, replace saved and deleted content after cursor */
					
					// Workaround for ie (6?) bug which doesn't allow an empty element to be selected
					newTextBlock.innerHTML = "dummy";
					lasso().selectNode(newTextBlock).select();
					newTextBlock.innerHTML = savedElemContent;
					
					// Tidy MozBrs (previous code section often) removes all MozBrs)
					ghostedit.textblock.mozBrs.tidy(newTextBlock);
					
					// Set caret to start of new element
					if(wheretoinsert === "before") {
						lasso().selectNodeContents(elem).collapseToStart().select();
					}
					else {
						lasso().selectNodeContents(newTextBlock).collapseToStart().select();
					}
					
					ghostedit.util.cancelEvent ( e );
					return (result !== false) ? true : false;
				}
			}
		},
		
		deleteSelectionContents: function (textblockelem) {
			var startofblock, endofblock, selrange;
			
			// Temporary selection range to avoid changing actual saved range
			selrange = ghostedit.selection.savedRange.clone();
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(textblockelem);
			endofblock = lasso().setCaretToEnd(textblockelem);
			
			// If selrange starts before block, move start of selrange to start of block
			if (selrange.compareEndPoints("StartToStart", startofblock) === -1) {
				selrange.setStartToRangeStart(startofblock);
			}
			
			// If selrange end after block, move end of selrange to end of block
			if (selrange.compareEndPoints("EndToEnd", endofblock) === 1) {
				//alert(textblockelem.id);
				selrange.setEndToRangeEnd(endofblock);
			}
			
			selrange.deleteContents();
			
			return true;
		},
		
		merge: function (block1, block2) {
			var block1type, block2type;
			
			block1type = block1.getAttribute("data-ghostedit-elemtype");
			block2type = block2.getAttribute("data-ghostedit-elemtype");
			
			// If one of the blocks isn't a textblock, return false
			if (block1type !== "textblock" || block2type !== "textblock") return false;
			
			// Otherwise, append block2content to block1 and delete block2
			block1.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + block2.innerHTML;
			block2.parentNode.removeChild(block2);
			ghostedit.textblock.mozBrs.tidy(block1);
			lasso().selectNode("ghostedit_marker").select()//.deleteContents();
			document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
			return true;
		},
		
		isEmpty: function (textblockelem) {
			var isEmpty = false, elements;
			
			// If the node contains textual content then it's not empty
			if (ghostedit.util.strip_tags(textblockelem.innerHTML).length > 1) return false;
			
			// If the node contains no textual content and no <br> or <img> tags then it is empty
			if (ghostedit.util.strip_tags(textblockelem.innerHTML, "<br><img>").length < 1) return true;
				
			// Otherwise check for non MozDirty <br>'s
			elements = textblockelem.getElementsByTagName("br");
			
			for(i = 0; i < elements.length; i += 1) {
				if(elements[i].MozDirty === undefined && !/moz_dirty/.test(elements[i].className)) return false;
			}
			
			// If none are found then it's empty
			return true;
		},
		
		count: function () {
			var editdiv, childCount, i;
			editdiv = ghostedit.editdiv;
			childCount = 0;
			for(i = 0; i < editdiv.getElementsByTagName("*").length; i += 1) {
				if(editdiv.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") == "textblock") {
					childCount += 1;
				}
			}
			return childCount;
		},
		
		isFirst: function (textblockelem) {
			var editdiv, i;
			editdiv = ghostedit.editdiv;
			for(i = 0; i < editdiv.getElementsByTagName("*").length; i += 1) {
				if(editdiv.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") == "textblock") {
					if(editdiv.getElementsByTagName("*")[i] === textblockelem) {
						return true;
					}
					else {
						return false;
					}
				}
			}
		},
		
		isLast: function (textblockelem) {
			var editdiv, i;
			editdiv = ghostedit.editdiv;
			for(i = editdiv.getElementsByTagName("*").length - 1; i > 0; i -= 1) {
				if(editdiv.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") == "textblock") {
					if(editdiv.getElementsByTagName("*")[i] === textblockelem) {
						return true;
					}
					else {
						return false;
					}
				}
			}
		}
	},	
	

	

	

	
	format: {
		useCommand: function (commandType, param) {
			if (typeof param == "undefined") { param = null; }
			
			ghostedit.history.saveUndoState();
			
			document.execCommand(commandType, false, param);
			
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
		},
		
		useCommandOnWord: function (command) {
			var range, marker;
			if (ghostedit.selection.savedRange.isCollapsed() && ghostedit.selection.getStarttextblockNode()) {
				range = ghostedit.selection.savedRange.clone();
				if (document.createRange) {
					marker = document.createElement("span");
					marker.id = "ghostedit_marker";
					range.getNative().insertNode(marker);
				}
				if (!document.createRange && document.selection) {
					range.getNative().pasteHTML("<span id='ghostedit_marker'>z</span>")
				}
				range.selectNode("ghostedit_marker");
				range = ghostedit.selection.extendtoword(range, true);
				range.select();
			}
			/* Placing cursor inside empty <b> doesn't work in ie <=8 (might work in 6/7)
			if (range.isCollapsed() && document.selection) {
				if (document.selection) {
					range.getNative().pasteHTML("<b><span id='ghostedit_marker'>&#x200b;</span></b>");
					alert(lasso().selectNodeContents("ghostedit_marker").getHTML());//.select().deleteContents();
					//document.getElementById("ghostedit_newnode").innerHTML = "";
					//document.getElementById("ghostedit_newnode").id = "";
				}
			}
			else {*/
			ghostedit.format.useCommand(command);
			
			if (document.getElementById("ghostedit_marker")) {
				lasso().selectNode("ghostedit_marker").select();
				document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
			}
			ghostedit.selection.save();
		},
		
		bold: function () {
			ghostedit.format.useCommandOnWord("bold");
		},
		
		italic: function () {
			ghostedit.format.useCommandOnWord("italic");
		},
		
		underline: function () {
			ghostedit.format.useCommandOnWord("underline");
		},
		
		strikethrough: function () {
			ghostedit.format.useCommandOnWord("strikethrough");
		},
		
		textColor: function (color) {
			ghostedit.format.useCommand("foreColor",color);
		},
		
		alignText: function (alignDirection) {
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			
			var elem, startpara, endpara;
			startpara = ghostedit.selection.getStarttextblockNode();
			endpara = ghostedit.selection.getEndtextblockNode();
			
		
			if (startpara && endpara) {
				elem = startpara;
				do {
					if (elem.getAttribute("data-ghostedit-elemtype").toLowerCase() == "textblock") {
						elem.style.textAlign = alignDirection;
					}
					if (elem.nextSibling && elem.id != endpara.id) {
						elem = elem.nextSibling;
					}
					else {
						break;
					}
				}
				while (true);
			}
			document.getElementById("alignleftButton").className = "";
			document.getElementById("alignrightButton").className = "";
			document.getElementById("aligncenterButton").className = "";
			document.getElementById("alignjustifyButton").className = "";
			document.getElementById("align" + alignDirection + "Button").className = "current";
			ghostedit.history.saveUndoState();
		},
		
		// .tagName is readonly -> need to remove element and add new one
		setTagType: function (tagtype, newclass) {
			var target, parent, handler, targetid, newElem;
			ghostedit.history.saveUndoState();
			
			// Retrieve target node
			target = ghostedit.selection.nodepath[0];
			if (!target) return false;
			
			// Save id of target
			targetid = 'ghostedit_textblock_' + target.id.replace("ghostedit_textblock_","");
			
			// Create replacement element, and copy over attributes/html
			newTextBlock = ghostedit.textblock.create(tagtype, target.innerHTML);
			newTextBlock.setAttribute("style", target.getAttribute("style"));
			if (newclass !== undefined) newTextBlock.className = newclass;

			// Ask (ghost) parent to insert new element into page
			parent = ghostedit.dom.getParentGhostBlock(target);
			handler = parent.getAttribute("data-ghostedit-handler");
			result = ghostedit[handler].api.addchild (parent, "before", target, newTextBlock, {"contentlength": target.innerHTML});
			
			// Remove old element
			ghostedit[handler].api.removechild (parent, target);
			
			// Set id of new TextBlock
			newTextBlock.id = targetid;
			
			// Set cursor to end of new element and save selection
			lasso().setCaretToStart(newTextBlock).select(); // For some reason setting to end doesn't work in opera (sets to start of next node I think)'
			ghostedit.selection.save();
			
			ghostedit.history.saveUndoState();
			return true;
		},
		
		insert: {
			character: function (character) {
				if(ghostedit.selection.isvalid) {
					ghostedit.selection.restore();
					ghostedit.selection.savedRange.pasteText(character);
				}
			},
			
			br: function () {
				//var isEmpty = false;
				var s, newBr, r;
				if (window.getSelection) {
					s = window.getSelection();
					s.getRangeAt(0).collapse(false);
					newBr = document.createElement("br");
					newBr.id = "newBr";
					s.getRangeAt(0).insertNode(newBr);
					s.getRangeAt(0).selectNode(newBr.parentNode);
					//alert(newBr.nextSibling);
					r = document.createRange();
					r.setStartAfter(newBr);
					r.setEndAfter(newBr);
					s.removeAllRanges();
					s.addRange(r);
					document.getElementById("newBr").removeAttribute("id");
				}
				else if (document.selection) { 
					r = document.selection.createRange();
					r.collapse(false);
					r.pasteHTML("<br id='newBr' />");
					r.moveToElementText(document.getElementById("newBr"));
					r.collapse(false);
					r.select();
					document.getElementById("newBr").removeAttribute("id");
				}
			}
		}
	},
	
	link: {
		focusedlink: false,
		
		ghostevent: function (event, target, source, params) {
			switch (event) {
				case "postimport":
					if (!params || !params.editdiv) return false;
					var aelems = params.editdiv.getElementsByTagName("a");
					for (i = 0; i < aelems.length; i += 1) {
						aelems[i].setAttribute("data-ghostedit-elemtype","link");
						aelems[i].setAttribute("data-ghostedit-handler","link");
					}
					return true;
				break;
			}
			return false;
		},
		
		
		deleteSelectionContents: function () {
			return false;
		},
		
		create: function (url) {
			ghostedit.history.saveUndoState();
			var urlinput, textinput, aelems, i;
	
			if (typeof url == "undefined") {
				urlinput = document.getElementById("ghostedit_urlinput");
				textinput = document.getElementById("ghostedit_linktextinput");
				urlinput.blur();
				ghostedit.selection.savedRange.select();//.pasteText(textinput.value, false);
				document.execCommand("CreateLink", false, urlinput.value);
			} 
			else {
				document.execCommand("CreateLink", false, url);
			}
			
			aelems = ghostedit.editdiv.getElementsByTagName("a");
			for (i = 0; i < aelems.length; i += 1) {
				aelems[i].setAttribute("data-ghostedit-elemtype","link");
				aelems[i].setAttribute("data-ghostedit-handler","link");
			}
			
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
		},
		
		remove: function () {
			ghostedit.format.useCommand("unlink");
		},
		
		focus: function (link) {
			var linkbox, linkIdNum, left, linkbounds;
			ghostedit.link.unfocus();
			if (ghostedit.isEditing == true && ghostedit.link.focusedlink == false) {
				
				link.className = "ghostedit_focusedlink";
				linkIdNum = "";//link.id.replace("ghostedit_link_","");
				
				
				if (linkbox = document.getElementById("ghostedit_focusedlinkbox_" + linkIdNum)) {
					linkbox.parentNode.removeChild(linkbox);
				}
				
				//alert("hi");
				linkbox = document.createElement("span");
				linkbox.className = "ghostedit_focusedlinkbox";
				linkbox.id = "ghostedit_focusedlinkbox_" + linkIdNum;				
				linkbox.innerHTML = "<a onclick='ghostedit.link.remove()' style='cursor: pointer; color: #333;'><b>&#215;</b> remove link</a>";
				linkbox.style.top = (link.offsetTop + link.offsetHeight - 1) + "px";
				//left = link.offsetLeft + link.offsetWidth < ghostedit.editdiv.offsetWidth ? link.offsetLeft + link.offsetWidth : link.getBoundingClientRect().left;
				linkbounds = link.getClientRects();
				linkbounds = linkbounds[linkbounds.length - 1];
				left = linkbounds.left;
				linkbox.style.left = (left - ghostedit.editdiv.getBoundingClientRect().left) + "px";

				//ghostedit.editdiv.contentEditable = false;
				ghostedit.editdiv.appendChild(linkbox);
				//ghostedit.editdiv.contentEditable = true;
				
				linkbox = document.getElementById('ghostedit_focusedlinkbox_' + linkIdNum);
				linkbox.style.MozUserSelect = 'none';
				linkbox.contentEditable = false;
				linkbox.unselectable = 'on';
				linkbox.onmousedown = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.ondragstart = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.ondraggesture = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.onclick = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.ondblclick = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.onresizestart = function (event) { return ghostedit.util.cancelEvent(event); };
				linkbox.oncontrolselect = function(event){return ghostedit.util.cancelAllEvents(event)};
				
				ghostedit.link.focusedlink = link;
				document.getElementById('ghostedit_toolbar_linkurl').value = (link.href == "http:") ? "http://" : link.href;
				ghostedit.ui.toolbar.enabletab("link");
				ghostedit.ui.toolbar.showtab("link");
			}
		},
		
		unfocus: function () {
			if (ghostedit.link.focusedlink != false) {
					ghostedit.editdiv.removeChild(document.getElementById("ghostedit_focusedlinkbox_"));
					ghostedit.link.focusedlink.className = "";
					ghostedit.link.focusedlink = false;
					ghostedit.ui.toolbar.disabletab("link");
					ghostedit.ui.toolbar.showtab("format");
			}
		},
		
		remove: function () {
			if (ghostedit.link.focusedlink != false) {
				//var linkcontent;
				//linkcontent = ghostedit.util.extractContents(ghostedit.link.focusedlink);
				var range = lasso().selectNode(ghostedit.link.focusedlink).select();
				//ghostedit.editdiv.removeChild(ghostedit.link.focusedlink);
				ghostedit.format.useCommand("unlink");
				range.collapseToEnd().select();
				ghostedit.link.unfocus();
			}
		},
		
		updateurl: function (newurl) {
			if (ghostedit.link.focusedlink != false && ghostedit.link.focusedlink.href != newurl) {
				ghostedit.link.focusedlink.href = newurl;
				ghostedit.link.focusedlink.title = newurl;
				ghostedit.ui.message.show("URL updated to '" + newurl + "'", 2, "success");
			}
		} ,
		
		open: function () {
			if (ghostedit.link.focusedlink != false) {
				window.open(ghostedit.link.focusedlink.href);
			}
		}
	},
	
	image: {
		elemid: 0,
		focusedimage: null, 
		justResized: false, //prevents loss of image focus after rezise in IE
		originalMouseX: null, originalMouseY: null, //Image resize variables
		buttons: [],
		
		api: {
			init: function () {
				ghostedit.inout.registerimportcapability ("image", "img");
				return true;
			},
			
			importHTML: function(source) {
				var newimg;
				
				// Create image element using source image's src				
				newimg = ghostedit.image.create(source.src);
				if (!newimg) return false;
				
				// Apply attributes
				if (source.className.length > 0 && !/ghostedit/.test(source.className)) {
					newimg.className = source.className;
				}
				newimg.alt = source.alt;
				newimg.title = source.title;
				if(!ghostedit.options.flexibleimages) {
					newimg.style.width = source.style.width;
					newimg.style.height = source.style.height;
				}
				newimg.style.cssFloat = source.style.cssFloat;
				newimg.style.styleFloat = source.style.styleFloat;
				newimg.style.clear = source.style.clear;
				if (source.style.cssFloat == "right" || source.style.styleFloat == "right") {
					newimg.style.marginLeft = "20px";
					newimg.style.marginRight = "0px";
				}
				else {
					newimg.style.marginLeft = "0px";
					newimg.style.marginRight = "20px";
				}
				
				// TODO postimport event which resizes too big images
				
				return newimg;
			},
			
			exportHTML: function (target) {
				if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "image") return false;	
				var finalCode = "", elem;
				elem = target;
				
				finalCode += "<img src='" + elem.src.toString() + "' alt='" + elem.alt.toString() + "' title='" + elem.title.toString() + "' ";
				finalCode += "style='";
				if(!ghostedit.options.flexibleimages) {
					finalCode += "width:" + elem.offsetWidth.toString() + "px;height; " + elem.offsetHeight + "px;";
				}
				if (elem.style.styleFloat == "left" || elem.style.cssFloat == "left") {
					finalCode += "float:left;clear:left;margin-right: 20px;";
				}
				else {
					finalCode += "float:right;clear:right;margin-left: 20px;";
				}
				if (elem.style.clear != "") finalCode += "clear:" + elem.style.clear;
				finalCode += "'";
				if (elem.className.length > 0 && !/ghostedit/.test(elem.className)) finalCode += " class='" + elem.className + "'";
				finalCode += " />";
				
				return {content: finalCode};
			}
		},
		
		ghostevent: function (eventtype, target, sourcedirection, params) {
			switch (eventtype) {
				case "delete":
					return false; // Don't handle (= passthrough)
				break;
			}
		},
		
		align: function (direction, e) {
			ghostedit.history.saveUndoState();
			if (ghostedit.image.focusedimage != null)
			{
				var img = ghostedit.image.focusedimage;
				img.style.styleFloat = direction;
				img.style.cssFloat = direction;
				//img.style.clear = direction;
				if (direction == "left") {
					img.style.marginRight = "20px";
					img.style.marginLeft = "0px";
				}
				else if (direction == "right") {
					img.style.marginRight = "0px";
					img.style.marginLeft = "20px";
				}
				ghostedit.image.focus(ghostedit.image.focusedimage);
			}
			ghostedit.history.saveUndoState();
			return ghostedit.util.cancelAllEvents(e);
		},
		
		moveup: function (e) {
			var i, img, editdiv, textblockelems, thisone, storedimg, offsetTopBefore, offsetLeftBefore, parent, handler;
			ghostedit.history.saveUndoState();
			if (ghostedit.image.focusedimage != null) {
				img = ghostedit.image.focusedimage;
				offsetLeftBefore = img.offsetLeft;
				offsetTopBefore = img.offetTop;
				
				if (anchor = ghostedit.dom.getPreviousSiblingGhostBlock(img)) {
					parent = ghostedit.dom.getParentGhostBlock(anchor);
					handler = parent.getAttribute("data-ghostedit-handler");
					ghostedit[handler].api.addchild(parent, "before", anchor, img);
				}				
				
				// If the image is still in the same position, then remove it's clear style
				if(offsetLeftBefore == img.offsetLeft && img.offsetTopBefore == img.offsetTop) {
					img.style.clear = "";
				}
				else {
					img.style.clear = "";
				}
				ghostedit.image.focus(ghostedit.image.focusedimage);
			}
			ghostedit.history.saveUndoState();
			return ghostedit.util.cancelAllEvents(e);
		},
		
		movedown: function (e) {
			var i, img, editdiv, textblockelems, thisone, nextone, elem = false, storedimg;
			ghostedit.history.saveUndoState();
			if (ghostedit.image.focusedimage != null)
			{
				img = ghostedit.image.focusedimage;
				offsetLeftBefore = img.offsetLeft;
				offsetTopBefore = img.offetTop;
				
				if (anchor = ghostedit.dom.getNextSiblingGhostBlock(img)) {
					parent = ghostedit.dom.getParentGhostBlock(anchor);
					handler = parent.getAttribute("data-ghostedit-handler");
					ghostedit[handler].api.addchild(parent, "after", anchor, img);
				}				
				
				// If the image is still in the same position, then remove it's clear style
				if(offsetLeftBefore == img.offsetLeft && img.offsetTopBefore == img.offsetTop) {
					img.style.clear = "";
				}
				else {
					img.style.clear = "";
				}
				ghostedit.image.focus(ghostedit.image.focusedimage);
			}
			ghostedit.history.saveUndoState();
			return ghostedit.util.cancelAllEvents(e);
		},
		
		setClear: function (clearval) {
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			
			var elem, startpara, endpara;
			startpara = ghostedit.selection.getStarttextblockNode();
			endpara = ghostedit.selection.getEndtextblockNode();
			
			// Loop through selected paragraphs
			if (startpara && endpara) {
				elem = startpara;
				do {
					if (elem.getAttribute("data-ghostedit-elemtype").toLowerCase() == "textblock") {
						startpara.style.clear = clearval;
					}
					if (elem.nextSibling && elem.id != endpara.id) {
						elem = elem.nextSibling;
					}
					else {
						break;
					}
				}
				while (true);
			}
			
			// Loop through images attached to startpara
			elem = startpara;
			while (elem.previousSibling && elem.previousSibling.getAttribute("data-ghostedit-elemtype") == "image") {
				elem = elem.previousSibling;
				elem.style.clear = clearval;
			}
			
			document.getElementById('ghostedit_toolbar_clearselect').value = clearval;
			
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
		},
		
		remove: function (e)
		{
			ghostedit.history.saveUndoState();
			if (ghostedit.image.focusedimage != null)
			{
				var imgToDel = ghostedit.image.focusedimage;
				ghostedit.image.unfocus();
				if (imgToDel.parentNode)
				{
					imgToDel.parentNode.removeChild(imgToDel);
				}
			}
			if (e && e.preventDefault)
			{
				e.stopPropagation();//stops parent elements getting a click event (standards)
			}
			else if (window.event.cancelBubble != null)
			{
				window.event.cancelBubble = true; //stops parent elements getting a click event (IE)
			}
			ghostedit.history.saveUndoState();
			return false;
		},
		
		refocus: function () {
			var img = ghostedit.image.focusedimage;
			ghostedit.image.unfocus();
			ghostedit.image.focus(img);
		},
		
		unfocus: function () {
			if (ghostedit.image.focusedimage != null) {
				//if (justResized != true)
				//{
					ghostedit.image.focusedimage.style.border = "none";
					if(!ghostedit.options.flexibleimages) {
						ghostedit.image.focusedimage.style.height = (ghostedit.image.focusedimage.offsetHeight + 6) + "px";
						ghostedit.image.focusedimage.style.width = (ghostedit.image.focusedimage.offsetWidth + 6) + "px";
					}
					else {
						ghostedit.image.focusedimage.style.height = "";
						ghostedit.image.focusedimage.style.width = "";
					}
					
					// Remove resize handle
					if(!ghostedit.options.disableimageresize) {
						ghostedit.image.focusedimage.parentNode.removeChild(document.getElementById("ghostedit_image_resizehandle_" + ghostedit.image.focusedimage.id.replace("ghostedit_image_","")));
					}
					
					//Remove image buttons
					for(i = 0; i < ghostedit.image.buttons.length; i += 1) {
						ghostedit.image.buttons[i].hide();
					}
					ghostedit.image.buttons = [];
					
					ghostedit.image.focusedimage = null;
					if (ghostedit.ui.toolbar.currenttabname == "image"){ ghostedit.ui.toolbar.showtab("format"); }
					ghostedit.ui.toolbar.disabletab("image");
					/*var imgToolbar = document.getElementById("contextualToolbar");
					imgToolbar.style.display = "none";*/
				/*}
				else
				{
					justResized = false;
				}*/
			}
		},
		
		updatealttext: function (newalt) {
			if (ghostedit.image.focusedimage != false && ghostedit.image.focusedimage.alt != newalt) {
				ghostedit.image.focusedimage.alt = newalt;
				ghostedit.image.focusedimage.title = newalt;
				ghostedit.ui.message.show("Image description updated to '" + newalt + "'", 2, "success");
			}
		},
		
		srcdialog: function () {
			if (ghostedit.image.focusedimage != false) {
				//ghostedit.image.focusedimage.alt = newalt;
				ghostedit.ui.modal.show("<h3>Change Image Source</h3>" + 
				"yada yada");
			}
		},
		
		createbutton: function (imgIdNum, name, html, positionfunc) {
			var button, elem;
			
			// Create button element
			elem =  document.createElement("span");
			elem.id = "ghostedit_imagebutton_" + name + "_" + imgIdNum;
			elem.setAttribute("data-ghostedit-elemtype","ghostedit_imagebutton");
			elem.setAttribute("data-ghostedit-handler","image");
			elem.className = "ghostedit_imagebutton"
			elem.innerHTML = html;"&#215;";//"<img src='/static/images/x.png' style='vertical-align: middle' />";
			
			// Create button object
			button = {
				elem: elem
			}
			
			button.reposition = positionfunc;
			
			button.event = {
				mousedown: function (event) { return ghostedit.util.cancelEvent(event); },
				dragstart: function (event) { return ghostedit.util.cancelEvent(event); },
				draggesture: function (event) { return ghostedit.util.cancelEvent(event); },
				click: function (event) { return ghostedit.util.cancelEvent(event); },
				dblclick: function (event) { return ghostedit.util.cancelEvent(event); },
				resizestart: function (event) { return ghostedit.util.cancelEvent(event); }
			}
			
			button.show = function (img) {
				img.parentNode.appendChild(button.elem);
				button.elem.style.MozUserSelect = 'none';
				button.elem.contentEditable = false;
				button.elem.unselectable = 'on';
				button.elem.onmousedown = button.event.mousedown;
				button.elem.ondragstart = button.event.dragstart;
				button.elem.ondraggesture = button.event.draggesture;
				button.elem.onclick = button.event.click;
				button.elem.ondblclick = button.event.dblclick;
				button.elem.onresizestart = button.event.resizestart;
			}
			
			button.hide = function () {
				button.elem.parentNode.removeChild(button.elem);
			}
			
			button.register = function () {
				ghostedit.image.buttons.push(button);
			}
			
			return button;
		},
		
		focus: function (img, e) {
			var existHandle, resizeHandle, b, html, imgIdNum, imgToolbar;
			ghostedit.image.unfocus();
			ghostedit.link.unfocus();
			if (ghostedit.isEditing == true && ghostedit.image.focusedimage == null) {
				
				// Add border to image
				img.style.height = (img.offsetHeight - 6) + "px";
				img.style.width = (img.offsetWidth - 6) + "px";
				img.style.border = "3px solid #333";

				imgIdNum = img.id.replace("ghostedit_image_","");
				
				// Remove existing resize handle
				if (existHandle = document.getElementById("ghostedit_image_resizehandle_" + imgIdNum)) {
					existHandle.parentNode.removeChild(existHandle);
				}
				
				//Resize handle
				if(!ghostedit.options.disableimageresize) {
					resizeHandle = document.createElement("span");
					resizeHandle.className = "ghostedit_image_resizehandle";
					resizeHandle.id = "ghostedit_image_resizehandle_" + imgIdNum;
					resizeHandle.style.top = (img.offsetTop + img.offsetHeight - 13) + "px";
					if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
							resizeHandle.style.left = (img.offsetLeft + img.offsetWidth - 13) + "px";
							resizeHandle.style.cursor = "se-resize";
							resizeHandle.style.background = "URL(" + ghostedit.options.imageroot + "/resize-se.png)";
					}
					else {
							resizeHandle.style.left = (img.offsetLeft) + "px";
							resizeHandle.style.cursor = "sw-resize";
							resizeHandle.style.background = "URL(" + ghostedit.options.imageroot + "/resize-sw.png)";
					}
					ghostedit.editdiv.appendChild(resizeHandle);
					resizeHandle = document.getElementById('ghostedit_image_resizehandle_' + imgIdNum);
					resizeHandle.style.MozUserSelect = 'none';
					resizeHandle.contentEditable = false;
					resizeHandle.unselectable = 'on';
					resizeHandle.onmousedown = function(event){ return ghostedit.image.startresize(this, event);};
					resizeHandle.ondragstart = function(event){ return ghostedit.util.cancelEvent(event); };
					resizeHandle.ondraggesture = function(event){return ghostedit.util.cancelEvent(event); };
					resizeHandle.onclick = function (event) { return ghostedit.util.cancelEvent(event); };
					resizeHandle.ondblclick = function(event){return ghostedit.util.cancelEvent(event); };
					resizeHandle.onresizestart = function(event){return ghostedit.util.cancelEvent(event); };
				}
				
				
				
				//Align button
				b = ghostedit.image.createbutton(imgIdNum, "align", ">", function (img, button) {
					button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15) + "px";
					if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
						button.elem.style.left = (img.offsetLeft + img.offsetWidth - 15) + "px";
						button.elem.innerHTML = "&gt;";
					}
					else {
						button.elem.style.left = (img.offsetLeft - 15) + "px";
						button.elem.innerHTML = "&lt;";
					}
				});
				if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
					b.event.click = function(event){return ghostedit.image.align("right", event);};
				}
				else {
					b.event.click = function(event){return ghostedit.image.align("left", event);};
				}
				b.register();
				
				//Delete button
				b = ghostedit.image.createbutton(imgIdNum, "delete", "&#215;", function (img, button) {
					button.elem.style.top = (img.offsetTop) + "px";
					button.elem.style.left = (img.offsetLeft) + "px";
				});
				b.event.click = function(event){return ghostedit.image.remove(event);};
				b.register();
				
				//Up button
				b = ghostedit.image.createbutton(imgIdNum, "up", "^", function (img, button) {
					//button.elem.style.top = (img.offsetTop - 15) + "px";
					//button.elem.style.left = (img.offsetLeft + (img.offsetWidth/2) - 15) + "px";
					button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15 - 40) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft + img.offsetWidth - 15 : img.offsetLeft - 15) + "px";
				});
				b.event.click = function(event){return ghostedit.image.moveup(event);};
				//b.register();
				
				//Down button
				b = ghostedit.image.createbutton(imgIdNum, "down", "&caron;", function (img, button) {
					//button.elem.style.top = (img.offsetTop + img.offsetHeight - 15) + "px";
					//button.elem.style.left = (img.offsetLeft + (img.offsetWidth/2) - 15) + "px";
					button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15 + 40) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft + img.offsetWidth - 15 : img.offsetLeft - 15) + "px";
				});
				b.event.click = function(event){return ghostedit.image.movedown(event);};
				//b.register();
				
				//Small size button
				b = ghostedit.image.createbutton(imgIdNum, "small", "Small", function (img, button) {
					button.elem.style.top = (img.offsetTop + 40) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 60) + "px";
					button.elem.style.width = '60px';
				});
				b.event.click = function(event){
					var img = ghostedit.image.focusedimage; 
					img.className = 'small';
					img.style.height = "";
					img.style.width = "";
					img.style.height = (img.offsetHeight - 12) + "px";
					img.style.width = (img.offsetWidth - 12) + "px";
					ghostedit.image.setbuttonpositions();
					return ghostedit.util.cancelEvent(event);
				};
				//b.register();
				
				//Golden size button
				b = ghostedit.image.createbutton(imgIdNum, "golden", "Golden", function (img, button) {
					button.elem.style.top = (img.offsetTop + 80) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 80) + "px";
					button.elem.style.width = '80px';
				});
				b.event.click = function(event){
					var img = ghostedit.image.focusedimage; 
					img.className = 'golden';
					img.style.height = "";
					img.style.width = "";
					img.style.height = (img.offsetHeight - 12) + "px";
					img.style.width = (img.offsetWidth - 12) + "px";
					ghostedit.image.setbuttonpositions();
					return ghostedit.util.cancelEvent(event);
				};
				//b.register();
				
				//Medium size button
				b = ghostedit.image.createbutton(imgIdNum, "medium", "Medium", function (img, button) {
					button.elem.style.top = (img.offsetTop + 120) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 80) + "px";
					button.elem.style.width = '80px';
				});
				b.event.click = function(event){
					var img = ghostedit.image.focusedimage; 
					img.className = 'medium';
					img.style.height = "";
					img.style.width = "";
					img.style.height = (img.offsetHeight - 12) + "px";
					img.style.width = (img.offsetWidth - 12) + "px";
					ghostedit.image.setbuttonpositions();
					return ghostedit.util.cancelEvent(event);
				};
				//b.register();
				
				//Fullwidth size button
				b = ghostedit.image.createbutton(imgIdNum, "fullwidth", "Full Width", function (img, button) {
					button.elem.style.top = (img.offsetTop + 160) + "px";
					button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 100) + "px";
					button.elem.style.width = '100px';
				});
				b.event.click = function(event){
					var img = ghostedit.image.focusedimage; 
					img.className = 'fullwidth';
					img.style.height = "";
					img.style.width = "";
					img.style.height = (img.offsetHeight - 12) + "px";
					img.style.width = (img.offsetWidth - 12) + "px";
					ghostedit.image.setbuttonpositions();
					return ghostedit.util.cancelEvent(event);
				};
				//b.register();
				
				//Clear button
				html = "<select onclick='ghostedit.util.preventBubble()' onchange='ghostedit.image.focusedimage.style.clear = this.value;ghostedit.image.refocus();'>";
				html += "<option value='' " + (img.style.clear == '' ? "selected='selected' " : "") + ">Clear: none</option>";
				html += "<option value='left' " + (img.style.clear == 'left' ? "selected='selected' " : "") + ">Clear: left</option>";
				html += "<option value='right' " + (img.style.clear == 'right' ? "selected='selected' " : "") + ">Clear: right</option>";
				html += "<option value='both' " + (img.style.clear == 'both' ? "selected='selected' " : "") + ">Clear: both</option>";
				html += " </select>";
				b = ghostedit.image.createbutton(imgIdNum, "clear", html, function (img, button) {
					button.elem.style.top = (img.offsetTop) + "px";
					button.elem.style.left = (img.offsetLeft + (img.offsetWidth) - 100) + "px";
					button.elem.style.width = '100px';
					button.elem.style.cursor = 'default';
				});
				b.event.click = null;
				b.event.mousedown = null;
				//b.register();
				
				
				img.parentNode.contentEditable = false;
				if(!ghostedit.options.disableimageresize) {
					img.parentNode.appendChild(resizeHandle);
				}
				for(i = 0; i < ghostedit.image.buttons.length; i += 1) {
					ghostedit.image.buttons[i].show(img);
					ghostedit.image.buttons[i].reposition(img, ghostedit.image.buttons[i]);
				}
				img.parentNode.contentEditable = true;
				
				ghostedit.selection.updatePathInfo(img);
				ghostedit.ui.api.update();
				
				//restoreSavedSelection();
				document.getElementById("ghostedit_imagekeycapture").focus();
				ghostedit.image.focusedimage = img;
				//document.getElementById("ghostedit_toolbar_imagesrc").value = img.src;
				document.getElementById("ghostedit_toolbar_imagealttext").value = img.alt;
				ghostedit.ui.toolbar.enabletab("image");
				ghostedit.ui.toolbar.showtab("image");
				return ghostedit.util.cancelEvent ( e );
			}
		},
		
		startresize: function ( resizeHandle, e ) {
			ghostedit.history.saveUndoState();
			if (e == null) { e = window.event; }
			var img = document.getElementById("ghostedit_image_" + resizeHandle.id.replace("ghostedit_image_resizehandle_",""));
			
			ghostedit.image.originalMouseX = e.pageX || e.clientX + document.body.scrollLeft;
			ghostedit.image.originalMouseY = e.pageY || e.clientY + document.body.scrollTop;
			
			ghostedit.image.originalImageWidth = img.offsetWidth;
			ghostedit.image.originalImageHeight = img.offsetHeight;
				
			if (!img.getAttribute("data-ghostedit-nativewidth")) img.setAttribute("data-ghostedit-nativewidth", img.offsetWidth);
			if (!img.getAttribute("data-ghostedit-nativeheight")) img.setAttribute("data-ghostedit-nativeheight", img.offsetHeight);
			
			document.body.onmousemove = function(event){return ghostedit.image.handleresize(event);};
			document.body.onmouseup = function(event){return ghostedit.image.endresize(event);};
			return false;//stop image losing focus after resize in ie
		},
		
		handleresize: function (e) {
			var img, resizeHandle, alignbutton, curMouseX, curMouseY, newWidth, newHeight, origImageWidth, origImageHeight, origMouseX, origMouseY, nativeImageWidth, nativeImageHeight;
			e = window.event != null ? window.event : e;
			if (ghostedit.image.focusedimage == null) {
				ghostedit.image.unfocus ();
			}
			else {
				img = ghostedit.image.focusedimage;
				resizeHandle = document.getElementById("ghostedit_image_resizehandle_" + img.id.replace("ghostedit_image_",""));
				alignbutton = document.getElementById("ghostedit_imagebutton_align" + img.id.replace("ghostedit_image_",""));
				
				// Get variables
				curMouseX = e.pageX || e.clientX + document.body.scrollLeft;
				curMouseY = e.pageY || e.clientY + document.body.scrollTop;
				
				origMouseX = ghostedit.image.originalMouseX;
				origMouseY = ghostedit.image.originalMouseY;
				
				origImageHeight = ghostedit.image.originalImageHeight;
				origImageWidth = ghostedit.image.originalImageWidth;
				
				nativeImageHeight = img.getAttribute("data-ghostedit-nativeheight");
				nativeImageWidth = img.getAttribute("data-ghostedit-nativewidth");			
				
				
				// Calculate new width and height
				if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
					newWidth = origImageWidth + (curMouseX - origMouseX);
					newHeight = origImageHeight + (curMouseY - origMouseY);
				}
				else {
					newWidth = origImageWidth - (curMouseX - origMouseX);
					newHeight = origImageHeight + (curMouseY - origMouseY);
				}
				
				
				if (((newHeight / nativeImageHeight) * nativeImageWidth) > newWidth) {
					newWidth = (newHeight / nativeImageHeight) *nativeImageWidth;
				}
				else {
					newHeight = (newWidth / nativeImageWidth) * nativeImageHeight;
				}
				
				// If new width is greater than editdiv width then make it the editdiv width
				if (newWidth >= img.parentNode.width) {
					newWidth = img.parentNode.width;
					newHeight = (newWidth / nativeImageWidth) * nativeImageHeight;
				}
				
				// Set image to new dimensions
				img.style.width = newWidth + "px";
				img.style.height = newHeight + "px";
				
				ghostedit.image.setbuttonpositions();
			}
		},
		
		setbuttonpositions: function () {
			var img, resizeHandle, deletebutton, alignbutton, upbutton, downbutton;
			if (img = ghostedit.image.focusedimage) {
				
				// Position resize handle
				if(!ghostedit.options.disableimageresize) {
					resizeHandle = document.getElementById("ghostedit_image_resizehandle_" + img.id.replace("ghostedit_image_",""));
					resizeHandle.style.top = (img.offsetTop + img.offsetHeight - 13) + "px";
					if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
						resizeHandle.style.left = (img.offsetLeft + img.offsetWidth - 13) + "px";
					}
					else {
						resizeHandle.style.left = (img.offsetLeft) + "px";
					}
				}
				
				// Position image buttons
				for(i = 0; i < ghostedit.image.buttons.length; i += 1) {
					ghostedit.image.buttons[i].reposition(img, ghostedit.image.buttons[i]);
				}
			}
		},
		
		endresize: function (e) {
			ghostedit.image.justResized = true;
			ghostedit.image.handleresize(e);
			document.body.onmousemove = null;
			document.body.onmouseup = null;
			ghostedit.history.saveUndoState();
		},
		
		insert: function () {
			var imageurlinput;
			imageurlinput = document.getElementById("ghostedit_imageurlinput");
			imageurlinput.blur();
			ghostedit.image.newImageBefore (null, null, false);
			ghostedit.ui.modal.hide();
		},
		
		insertInline: function (elem, srcURL, skipResize) {
			ghostedit.history.saveUndoState();
			ghostedit.selection.restore();
			if (elem == null) { elem = ghostedit.selection.savedRange.getStartNode(); }
			elem = ghostedit.selection.gettextblockNode ( elem );
			
			if (srcURL == null) { srcURL = document.getElementById("ghostedit_imageurlinput").value; }


			if(document.createRange) {
				newImg = document.createElement("img");
				ghostedit.imgElemId += 1;
				newImg.id = 'ghostedit_image_' + (1000 + ghostedit.imgElemId);
				ghostedit.selection.savedRange.getNative().insertNode(newImg);
			}
			else if (document.selection) {
				ghostedit.selection.savedRange.getNative().pasteHTML("<img id='ghostedit_image_" + (1000 + ghostedit.imgElemId) + "' />");
			}
			
			var addedImage = document.getElementById('ghostedit_image_' + (1000 + ghostedit.imgElemId));
			addedImage.setAttribute("data-ghostedit-elemtype", "image");
			addedImage.setAttribute("data-ghostedit-handler", "image");
			addedImage.contentEditable = 'false';
			addedImage.unselectable = 'on';
			var that = {
				i: addedImage,
				s: skipResize
			}
			that.callself = function () {
				ghostedit.image.onload(that.i, that.s, true)
			}
			addedImage.onload = that.callself;//function(img, skipResize){return ghostedit.image.onload(img, skipResize, false)}(addedImage, skipResize);
			addedImage.src = srcURL;
			addedImage.onclick = function(e){ghostedit.image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
			addedImage.ondragstart = function(event){
				event = window.event ? window.event : event;
				if (event.dataTransfer) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setData("Text", addedImage.id);
				}
				return true;
				};
			addedImage.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
			addedImage.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
			addedImage.oncontrolselect = function(e){ghostedit.image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
		},
		
		create: function (srcURL) {
			var newimg;
			
			// Create image element and set id
			newimg = document.createElement("img");
			ghostedit.image.elemid += 1;
			newimg.id = 'ghostedit_image_' + ghostedit.image.elemid;
			
			// Set basic attributes
			newimg.src = srcURL; //set source after adding to DOM otherwise onload is not fired in IE (no longer using onload event)
			if (ghostedit.options.defaultimageclass) newimg.className = ghostedit.options.defaultimageclass;
			newimg.setAttribute("data-ghostedit-elemtype", "image");
			newimg.setAttribute("data-ghostedit-handler", "image");
			
			// Prevent browser default image editing controls
			newimg.contentEditable = 'false';
			newimg.unselectable = 'on';
			newimg.galleryimg = 'no'; //hide IE image toolbar

			// Set drag and drop event handlers
			newimg.onclick = function(e) { ghostedit.image.focus(this,e);ghostedit.util.cancelAllEvents(e); };
			newimg.ondragstart = function(event) {
				event = window.event ? window.event : event;
				if (event.dataTransfer) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setData("Text", newimg.id);
				}
				return true;
				};
			newimg.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
			newimg.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
			newimg.oncontrolselect = function(e){ghostedit.image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
			
			return newimg;
		},
		
		newImageBefore: function (elem, srcURL, skipResize, wheretoinsert) {
			var that, addedImage, parent, handler, result;
			ghostedit.history.saveUndoState();
			if (elem == null) { elem = ghostedit.selection.savedRange.getStartNode(); }
			elem = ghostedit.selection.gettextblockNode ( elem );
			if (wheretoinsert !== "after") wheretoinsert = "before";
			
			if (srcURL == null) { srcURL = document.getElementById("ghostedit_imageurlinput").value; }

			if (!document.getElementById("ghostedit_image_" + elem.id.replace("ghostedit_textblock_", ""))) {
				newImg = document.createElement("img");
				ghostedit.image.elemid += 1;
				newImg.id = 'ghostedit_image_' + ghostedit.image.elemid;
				if (ghostedit.options.defaultimageclass) newImg.className = ghostedit.options.defaultimageclass;
				//newImg.src = srcURL;//set source after adding to DOM otherwise onload is not fired in IE
				
				
				// Ask (ghost) parent to insert new element into page
				parent = ghostedit.dom.getParentGhostBlock(elem);
				handler = parent.getAttribute("data-ghostedit-handler");

				result = ghostedit[handler].api.addchild (parent, wheretoinsert, elem, newImg);
				
				if (!result) return false;
			
				var addedImage = document.getElementById('ghostedit_image_' + ghostedit.image.elemid);
				
				// Set attributes and dom events
				addedImage.setAttribute("data-ghostedit-elemtype", "image");
				addedImage.setAttribute("data-ghostedit-handler", "image");
				addedImage.contentEditable = 'false';
				addedImage.unselectable = 'on';
				addedImage.galleryimg = 'no'; //hide IE image toolbar
				var clearval = (elem.style.clear == 'left') ? 'right' : 'left';
				addedImage.style.cssFloat = clearval;
				addedImage.style.styleFloat = clearval;
				addedImage.style.clear = elem.style.clear;
				addedImage.style.marginRight = '20px';
				var that = {
					i: addedImage,
					s: skipResize
				}
				that.callself = function () {
					ghostedit.image.onload(that.i, that.s, true)
				}
				addedImage.onload = that.callself;//function(img, skipResize){return ghostedit.image.onload(img, skipResize, false)}(addedImage, skipResize);
				addedImage.src = srcURL;
				addedImage.onclick = function(e){ghostedit.image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
				addedImage.ondragstart = function(event){
					event = window.event ? window.event : event;
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData("Text", addedImage.id);
					}
					return true;
					};
				addedImage.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
				addedImage.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
				addedImage.oncontrolselect = function(e){ghostedit.image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
				
				ghostedit.util.addClass(addedImage, "leftimage");
				
				//document.getElementById('ghostedit_image_' + elem.id).style.width = '200px';
				//document.getElementById('ghostedit_image_' + elem.id).style.height = '299px';
				//document.getElementById('block_' + elem.id).style.width = (486 - document.getElementById('ghostedit_image_' + elem.id).style.width.replace("px","") - 30) + "px";
				
				return addedImage;
			}
		},
		
		newImageFrame: function () { /* LEGACY, DO NOT USE */
			var that, addedImage;
			ghostedit.history.saveUndoState();
			elem = ghostedit.selection.savedRange.getStartNode();
			elem = ghostedit.selection.gettextblockNode ( elem );
			
			if(!elem || !elem.id) {
				ghostedit.ui.message.show("Please select a paragraph or heading before trying to insert an image.", 2, "error");
				return false;
			}
			
			if (!document.getElementById("ghostedit_image_" + elem.id.replace("ghostedit_textblock_", ""))) {
				newImg = document.createElement("div");
				newImg.innerHTML = "<h3>Image Uploading</h3>";
				newImg.id = 'ghostedit_image_' + elem.id.replace("ghostedit_textblock_", "");
				//newImg.src = srcURL;set source afdowns otherwise onload is not fired in IE
			
				if (elem.parentNode != null) {
					elem.parentNode.contentEditable = false;
					elem.parentNode.insertBefore(newImg, elem);
					elem.parentNode.contentEditable = true;
				}
				else {
					ghostedit.ui.message.show("Please select a paragraph or heading before trying to insert an image.", 2, "error");
				}
				var addedImage = document.getElementById('ghostedit_image_' + elem.id.replace("ghostedit_textblock_", ""));
				addedImage.setAttribute("data-ghostedit-elemtype","image");
				addedImage.setAttribute("data-ghostedit-handler","image");
				addedImage.contentEditable = 'false';
				addedImage.unselectable = 'on';
				addedImage.style.width = '240px';
				addedImage.style.height = '160px';
				addedImage.style.backgroundColor = '#EEE';
				addedImage.style.cssFloat = 'left';
				addedImage.style.styleFloat = 'left';
				addedImage.style.marginRight = '20px';
				addedImage.style.overflow = 'hidden';
				addedImage.setAttribute("data-ghostedit-nativewidth", 0);
				addedImage.setAttribute("data-ghostedit-nativeheight", 0);
				addedImage.onclick = function(e){ghostedit.image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
				addedImage.ondragstart = function(event){
					event = window.event ? window.event : event;
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData("Text", addedImage.id);
					}
					return true;
					};
				addedImage.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
				addedImage.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
				addedImage.oncontrolselect = function(e){ghostedit.image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
				return addedImage.id;
				//document.getElementById('ghostedit_image_' + elem.id).style.width = '200px';
				//document.getElementById('ghostedit_image_' + elem.id).style.height = '299px';
				//document.getElementById('block_' + elem.id).style.width = (486 - document.getElementById('ghostedit_image_' + elem.id).style.width.replace("px","") - 30) + "px";
			}
		},
		
		onload: function ( img, skipResize, hasWaited ) {
			if (hasWaited == true) {
				img.setAttribute("data-ghostedit-nativewidth", 0);
				img.setAttribute("data-ghostedit-nativeheight", 0);
				if (!ghostedit.options.disableimageresize && !skipResize && img.offsetWidth > 200) {
					var newWidth = 200;
					var newHeight = (newWidth / img.offsetWidth) * img.offsetHeight;
					img.style.width = newWidth + "px";
					img.style.height = newHeight + "px";
				}
				img.contentEditable = false;
				ghostedit.history.saveUndoState();
			}
			else {
				var that = {
					i: img,
					s: skipResize
				}
				that.callself = function () {
					ghostedit.image.onload(that.i, that.s, true)
				}
				setTimeout(that.callself, 20);
			}
		},
		
		deleteSelectionContents: function(image) {
			//Do nothing (images shouldn't be deleted via selection)
			return true;
		}
	},
	
	list: { /* DO NOT USE THE LIST FUNCTIONS, THEY WILL MESS UP YOUR DOCUMENT */
		elemid: 0,
		itemelemid: 0,
		ghostevent: function (eventtype, target, sourcedirection, params) {
			var docall = false, blocktype, eventhandled = false, newtarget, result;
			switch (eventtype) {
				case "delete":
					elemtype = target.getAttribute("data-ghostedit-elemtype");
					if (elemtype === "list") {
						if (sourcedirection === "ahead" || sourcedirection === "behind") {
							newtarget = (sourcedirection === "ahead") ? ghostedit.dom.getLastChildGhostBlock(target) : ghostedit.dom.getFirstChildGhostBlock(target);
							return ghostedit.list.ghostevent("delete", newtarget, sourcedirection, params);
						}
						else return false;
					}
					else if (elemtype === "listitem") {
						//alert(target.id + sourcedirection);
						if (sourcedirection === "ahead" || sourcedirection === "behind") {
							newtarget = ghostedit.dom.getFirstChildGhostBlock(target);
							result = ghostedit.textblock.gevent.textdelete (newtarget, sourcedirection, params);
						}
						else if (sourcedirection === "top") {
							result = ghostedit.event.sendBackwards("delete", target, params);
						}
						else if (sourcedirection === "bottom") {
							result = ghostedit.event.sendForwards("delete", target, params);
						}
						//alert(target.id + sourcedirection + result);
						return result;
					}
				break;	
				/*case "keydown":
					switch (params.keycode) {
						case 8: // backspace
							return ghostedit.textblock.event.backspace(target, params.event);
						break;
						case 46: //delete
							return ghostedit.textblock.event.deletekey (target, params.event);
						break;
					}
				break;
				case "keypress":
					switch (params.keycode) {
						case 13: // enter
							return ghostedit.textblock.event.enterkey (target, params.event);
						break;
					}
				break;*/
			}
			
		},
		
		api: {
			init: function () {
				ghostedit.inout.registerimportcapability ("list", "ol", "ul", "li");
				return true;
			},
			importHTML: function (sourcenode) {
				var i, list, handler, result, listitem, child, textblock = false;
				if (!sourcenode || !sourcenode.tagName) return false;
				switch (sourcenode.tagName.toLowerCase()) {
					case "ol":
					case "ul":
						// Create list element
						list = ghostedit.list.create(sourcenode.tagName.toLowerCase());
												
						// If chidlren, loop through and import if they are list items
						if (sourcenode.childNodes && sourcenode.childNodes.length) {
							for (i = 0; i < sourcenode.childNodes.length; i += 1) {
								elem = sourcenode.childNodes[i];
								if (elem.nodeType !== 1 || elem.tagName.toLowerCase() !== "li")  continue;
								
								result = ghostedit.list.api.importHTML(elem)
								if (result && ghostedit.dom.isGhostBlock(result)) {
									list.appendChild(result);
								}
							}
						}
						
						// Check any list item children have been added, else add empty list item
						if (!ghostedit.dom.getFirstChildGhostBlock(list)) {
							list.appendChild(ghostedit.list.createItem("p"));
						}
						
						ghostedit.log.send ("list-import","List imported.");
						return list;
					break;
					case "li":
						listitem = ghostedit.list.createItem();
						
						child = ghostedit.dom.getFirstChildElement (sourcenode);
						
						if (child && child.tagName) {
							switch (child.tagName.toLowerCase()) {
								case "p":
								case "h1":
								case "h2":
								case "h3":
								case "h4":
								case "h5":
								case "h6":
									textblock = ghostedit.textblock.api.importHTML (child);
								break;
								default:
									textblock = ghostedit.textblock.api.importHTML (sourcenode); //hack to deal with inline elements directly in list
								break;
							}	
						}
						
						
						if (textblock) {
							listitem.appendChild(textblock);
						}
						else {
							listitem.appendChild (ghostedit.textblock.create("p"));
						}
						
						ghostedit.log.send ("list-importitem","List item imported.");
						return listitem;
					break;
				}
			},
			exportHTML: function (target) {
				if (!target || !ghostedit.dom.isGhostBlock(target)) return false;
				var finalCode = "", item, listtype;
				
				switch (target.getAttribute("data-ghostedit-elemtype")) {
					case "list":
						// Get first child list item (if none, return false)
						item = ghostedit.dom.getFirstChildGhostBlock (target);
						if (!item) return false;
						
						// Run export function for each list item						
						do {
							result = ghostedit.list.api.exportHTML (item);
							if (result) finalCode += result.content;
						}
						while (item = ghostedit.dom.getNextSiblingGhostBlock(item));
						
						// If no list items return code, return false
						if (finalCode.length < 1) return false;
						
						// Add list code to listitem code
						listtype = (target.tagName.toLowerCase() === "ol") ? "ol" : "ul";
						finalCode = "<" + listtype + ">" + finalCode + "</" + listtype + ">";
						
						// Return code
						return {content: finalCode};
					break;
					case "listitem":
						// Get first child GhostBlock of list item (if none, return false)
						elem = ghostedit.dom.getFirstChildGhostBlock (target);
						if (!elem) return false;
						
						// Assume textblock, and call export function
						result = ghostedit.textblock.api.exportHTML (elem);
						if (result) finalCode += result.content;
						
						// If textblock doesn't return code (or isn't a textblock), return false 
						if (finalCode.length < 1) return false;
						
						// Add list item code to textblock code
						finalCode = "<li>" + finalCode + "</li>";
						
						// Return code
						return {content: finalCode};
					break;
				}
			},
		
			addchild: function (target, wheretoinsert, sourceelem, newElem, params) {
				var parent, listitem, result = false, newelemisempty = false;
				
				if (params && params.contentlength !== false) {
					newelemisempty = (params.contentlength < 1) ? true : false;
				}
				
				
				// Get target list if listelem is targetted
				if (target.getAttribute("data-ghostedit-elemtype") === "listitem") {
					target = ghostedit.dom.getParentGhostBlock (target);
				}
				if (target.getAttribute("data-ghostedit-elemtype") !== "list") return false;
				
				// Get listitem-parent of anchor elem
				anchorelem = sourceelem;
				while (anchorelem.getAttribute("data-ghostedit-elemtype") !== "listitem") {
					anchorelem = ghostedit.dom.getParentGhostBlock (anchorelem);
					if (anchorelem == null) return false;
				}
				
				
				//alert(ghostedit.dom.getNextSiblingGhostBlock(anchorelem) + newElem.innerHTML);
				// If last listelem and inserted node empty (caret is at end), then instead create paragraph after list
				if (newelemisempty && ghostedit.dom.getNextSiblingGhostBlock(anchorelem) === false && ghostedit.textblock.isEmpty(sourceelem)) {
					parent = ghostedit.dom.getParentGhostBlock (target);
					handler = parent.getAttribute("data-ghostedit-handler");
					//alert(handler + parent.id + newElem.innerHTML + target.id);
					result = ghostedit[handler].api.addchild(parent, "after", target, newElem);
				}
				if (result) {
					target.removeChild(anchorelem);
					//lasso().selectNode(newElem).collapseToStart().select();
					return result;
				}
				
				// If newElem not a list-item, wrap in one
				if (newElem.getAttribute("data-ghostedit-elemtype") !== "listitem") {
					listitem = document.createElement("li");
					ghostedit.list.itemelemid += 1;
					listitem.id = "ghostedit_listitem_" + ghostedit.list.itemelemid;
					listitem.setAttribute("data-ghostedit-elemtype", "listitem");
					listitem.setAttribute("data-ghostedit-handler", "list");
					listitem.appendChild(newElem);
					newElem = listitem;
				}
				
				if (wheretoinsert === "before") {
					target.insertBefore(newElem, anchorelem);
				}
				else {
					if (anchorelem.nextSibling != null) {
						target.insertBefore(newElem, anchorelem.nextSibling);
					}
					else {
						target.appendChild(newElem);
					}
				}
				return true;
			},
			
			removechild: function (target, child) {
				
				// Get target list if listelem is targetted
				if (target && target.getAttribute("data-ghostedit-elemtype") === "listitem") {
					target = ghostedit.dom.getParentGhostBlock (target);
				}
				
				if (!target || !child) return false;
				
				if (target.getAttribute("data-ghostedit-elemtype") !== "list") return false;
				
				
				// Get listitem-parent of anchor elem
				while (child.getAttribute("data-ghostedit-elemtype") !== "listitem") {
					child = ghostedit.dom.getParentGhostBlock (child);
					if (child == null) return false;
				}
				
				if (child.parentNode != target) return false;
				
				target.removeChild(child);
				
				return true;
			}
		},
		
		create: function (listtype) {
			if (listtype.toLowerCase() !== "ol") listtype = "ul";
			
			// Create element, and assign id and content
			newElem = document.createElement(listtype);
			ghostedit.blockElemId += 1;
			newElem.id = "ghostedit_list_" + ghostedit.blockElemId;
			
			// Set GhostEdit handler attributes
			newElem.setAttribute("data-ghostedit-iselem", "true");
			newElem.setAttribute("data-ghostedit-elemtype", "list");
			newElem.setAttribute("data-ghostedit-handler", "list");
			
			ghostedit.log.send ("list-create", "A new list was created.");
			return newElem;
		},
		
		createItem: function (textblocktype) {
			
			// Create element, and assign id and content
			newElem = document.createElement("li");
			ghostedit.blockElemId += 1;
			newElem.id = "ghostedit_list_item_" + ghostedit.blockElemId;
			
			// Set GhostEdit handler attributes
			newElem.setAttribute("data-ghostedit-iselem", "true");
			newElem.setAttribute("data-ghostedit-elemtype", "listitem");
			newElem.setAttribute("data-ghostedit-handler", "list");
			
			
			if (textblocktype) newElem.appendChild(ghostedit.textblock.create(textblocktype));
			
			ghostedit.log.send ("list-createitem", "A new list item was created.");
			return newElem;
		},
		
		remove: function (list) {
			var parent, handler;
			parent = ghostedit.dom.getParentGhostBlock(list);
			handler = parent.getAttribute("data-ghostedit-handler");
			return ghostedit[handler].api.removechild(parent, list);
		},
		
		convertTo: function (listtype) {
			/* BETTER VERSION Pseudo-code
			
			Loop up through nodepath, if node is textblock or listitem, toggle to other, tidy and return
			If it contains 'list', loop through listitems, and toggle to textblock, tidy and return
			Else, selection covers multiple GhostBlocks - loop through GhostBlocks:
				If textblock, convert to listitem, tidy
				If whole list, change list type
				If partial list of wrong type, loop through list items, convert to right type in new list
				If image, start new list
				(others not implemented yet, but need some way to recurse into containers and tables)
			(will need to loop through all, and convert to lists (but playing nicely with tables, images, etc)
			
			*/			
			/* EXTREMELY NAIVE */	
			var elem, startelem, endelem, contents, list, listitem, itemcount = 0, parent, tagname, dummyelem, lastelem;
			ghostedit.selection.save();
			
			if (listtype !== "ordered") listtype = "unordered";
			
			// Should check selection container, not assume textblocks
			startelem = ghostedit.selection.getStarttextblockNode();
			endelem = ghostedit.selection.getEndtextblockNode();
			
			parent = ghostedit.dom.getParentGhostBlock (startelem);
			handler = parent.getAttribute("data-ghostedit-handler");
			
			dummyelem = document.createElement("div");
			ghostedit[handler].api.addchild(parent, "before", startelem, dummyelem);
			
			tagname = (listtype === "ordered") ? "ol" : "ul";
			list = document.createElement(tagname);
			list.id = startelem.id;
			list.setAttribute("data-ghostedit-elemtype", "list");
			list.setAttribute("data-ghostedit-handler", "list");
			ghostedit.list.applydropevents(list);
			
			elem = startelem;
			do {
				if (elem.getAttribute("data-ghostedit-elemtype").toLowerCase() == "textblock") {
					itemcount += 1;
					listitem = document.createElement("li");
					ghostedit.list.itemelemid += 1;
					listitem.id = "ghostedit_listitem_" + ghostedit.list.itemelemid;
					listitem.setAttribute("data-ghostedit-elemtype", "listitem");
					listitem.setAttribute("data-ghostedit-handler", "list");
					list.appendChild(listitem);
					//listitem.id = "ghostedit_list_" + startelem.id.replace("ghostedit_textblock_","") + "_item_" + itemcount;
					//listitem.innerHTML = elem.innerHTML;
					//ghostedit.list.applydropevents(listitem);
					
					//if (elem != startelem) { elem.parentNode.removeChild(elem); }
				}
				if (elem.nextSibling && elem.id != endelem.id) {
					lastelem = elem;
					elem = elem.nextSibling;
					listitem.appendChild(lastelem);
				}
				else {
					listitem.appendChild(elem);
					break;
				}
				
			}
			while (true);
			
			startelem.id = "";
			ghostedit[handler].api.addchild(parent, "before", dummyelem, list);
			parent.removeChild(dummyelem);
			lasso().selectNodeContents(elem).collapseToStart().select();
	
		},
		
		toggle: function (listtype) {
			var i, inlist, list, intextbock, textblock, incontainer, container, node, newlist = false, afterlist = false, tagname, parent, handler;
			var beforenodes = [], selnodes = [], afternodes = [], selrange, range, isafterstart, isbeforeend, anchor, newblocks = [], range;
			inlist = intextblock = false;
			listtype = (listtype === "ordered") ? "ol" : "ul";
			
			// Loop up through node path, check whether selection is contained within a list or textblock
			for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
				node = ghostedit.selection.nodepath[i];
				switch (node.getAttribute("data-ghostedit-elemtype")){
					case "list":
						inlist = true;
						list = node;
					break;
					case "textblock":
						intextblock = true;
						textblock = node;
					break;
					case "container":
						incontainer = true;
						container = node;
					break;
				}
			}
			
			ghostedit.selection.savedRange.saveToDOM().select();
			
			// If selection contained in (non-list) textblock, convert to list
			if (intextblock && !inlist) {
				ghostedit.list.convertTextblock(textblock, listtype);
				if (range = lasso().restoreFromDOM()) range.select();
				ghostedit.selection.save();
				return true;
			}
			
			// Else, if selection contained in list, convert list items to other list type, or to textblocks
			if (inlist) {
				ghostedit.list.convertList(list, listtype);
				if (range = lasso().restoreFromDOM()) range.select();
				ghostedit.selection.save();
				return true;
			}
			
			// Else, if selection contained in container, go through container items converting to correct list form
			// 	skippping images, and then do massive tidy up at the end.
			if (incontainer) {
				ghostedit.list.convertContainerContents(container, listtype);
				if (range = lasso().restoreFromDOM()) range.select();
				ghostedit.selection.save();
				return true;
			}
			
			return false;
		},
		
		convertTextblock: function (textblock, listtype) {
				var newlist, newlistitem, tagname, parent, handler;
				// Create new list
				newlist = ghostedit.list.create(listtype);
				
				// Create list item, and add it to list
				tagname = textblock.tagName.toLowerCase();
				newlistitem = ghostedit.list.createItem();
				newlist.appendChild(newlistitem);
				
				// Add list to document
				parent = ghostedit.dom.getParentGhostBlock(textblock);
				handler = parent.getAttribute("data-ghostedit-handler");
				ghostedit[handler].api.addchild(parent, "before", textblock, newlist);
				
				// Move textblock to listitem
				newlistitem.appendChild(textblock);
				
				// Call tidy function on list
				ghostedit.list.tidy(newlist);
				
				// Focus textblock
				lasso().setCaretToEnd(textblock).select();
				ghostedit.selection.save();
				
				return textblock;
		},
		
		convertList: function (list, listtype) {
				var i, lists = [], node, newlist = false, afterlist = false, tagname, parent, handler;
				var beforenodes = [], selnodes = [], afternodes = [], selrange, range, isafterstart, isbeforeend, anchor;
				
				node = ghostedit.dom.getFirstChildGhostBlock (list)
				if (!node) { ghostedit.list.remove (list); return true; }
				
				ghostedit.selection.savedRange.restoreFromDOM(false);

				// Loop through list items and get which nodes are in and after the selection
				do {
					isafterstart = lasso().setCaretToEnd(node).compareEndPoints("StartToStart", ghostedit.selection.savedRange);
					isafterstart = (isafterstart >= 0) ? true : false;
					isbeforeend = lasso().setCaretToStart(node).compareEndPoints("EndToEnd", ghostedit.selection.savedRange);
					isbeforeend = (isbeforeend <= 0) ? true : false;
					
					//lasso().setCaretToStart(node).select();
					//ghostedit.selection.savedRange.select();
					//lasso().setCaretToStart(node).setEndToRangeEnd(ghostedit.selection.savedRange.getNative()).select();
					//return;
					
					if (!isafterstart) {
						beforenodes.push(node);
					}
					else if (isafterstart && isbeforeend) {
						selnodes.push (node);
					}
					else {
						afternodes.push (node);
					}
				}
				while (node = ghostedit.dom.getNextSiblingGhostBlock(node));
				
				// Get list parent and handles for inserting and removing GhostBlocks
				parent = ghostedit.dom.getParentGhostBlock(list);
				handler = parent.getAttribute("data-ghostedit-handler");
				
				//alert (beforenodes.length + ":" + selnodes.length + ":" + afternodes.length);
				//alert (beforenodes[0].id + ":" + selnodes[0].id + ":" + afternodes[0].id);
				
				// Move the after nodes (if any) to a new list and add list after current one
				if (afternodes.length > 0) {
					afterlist = ghostedit.list.create(list.tagName);
					
					for(i = 0; i < afternodes.length; i++) {
						afterlist.appendChild(afternodes[i]);	
					}
					
					ghostedit[handler].api.addchild(parent, "after", list, afterlist);
				}
				
				// If toggle type = list type, move selnodes to parent, else create new list of other type
				anchor = list;
				if (list.tagName.toLowerCase() === listtype) {
					for(i = 0; i < selnodes.length; i++) {
						node = ghostedit.dom.getFirstChildGhostBlock(selnodes[i]);
						if (node) {
							ghostedit[handler].api.addchild(parent, "after", anchor, node);
							anchor = node;
						}
						list.removeChild(selnodes[i]);
					}
					/*// Focus last node
					lasso().setCaretToEnd(node).select();
					ghostedit.selection.save();*/
				}
				else {
					newlist = ghostedit.list.create(listtype);
					
					for(i = 0; i < selnodes.length; i++) {
						newlist.appendChild(selnodes[i]);	
					}
					
					ghostedit[handler].api.addchild(parent, "after", list, newlist);
					
					/*// Focus first list item
					lasso().setCaretToEnd(selnodes[0]).select();
					ghostedit.selection.save();*/
				}
				
				// If no beforenodes, remove original list
				if (beforenodes.length === 0) {
					ghostedit.list.remove(list);
					list = false;
				}
				
				// Call tidy function on all existing lists
				if (list) {
					ghostedit.list.tidy(list);
					lists.push(list);
				}
				if (newlist)  {
					ghostedit.list.tidy(newlist);
					lists.push(newlist);
				}
				if (afterlist) {
					ghostedit.list.tidy(afterlist);
					lists.push(afterlist);
				}
				
				return lists;
		},
		
		convertContainerContents: function (container, listtype) {
			var i, inlist, list, intextbock, textblock, incontainer, container, node, newlist = false, afterlist = false, tagname, parent, handler;
			var beforenodes = [], selnodes = [], afternodes = [], selrange, range, isafterstart, isbeforeend, anchor, newblocks = [];
			
			
			node = ghostedit.dom.getFirstChildGhostBlock (container)
				
			// Loop through container items call conversion functions on textblocks and lists
			do {
				isafterstart = lasso().setCaretToEnd(node).compareEndPoints("StartToStart", ghostedit.selection.savedRange);
				isafterstart = (isafterstart >= 0) ? true : false;
				isbeforeend = lasso().setCaretToStart(node).compareEndPoints("EndToEnd", ghostedit.selection.savedRange);
				isbeforeend = (isbeforeend <= 0) ? true : false;
				
				if (isafterstart && isbeforeend) {
					selnodes.push(node);
				}
				else if (!isbeforeend) break;

			}
			while (node = ghostedit.dom.getNextSiblingGhostBlock(node));
			
			for(i = 0; i < selnodes.length; i++) {
				node = selnodes[i];
				switch (node.getAttribute("data-ghostedit-elemtype")){
					case "list":
						//newblocks.concat( ghostedit.list.convertList(node, listtype) );
						if (node.tagName.toLowerCase() !== listtype) ghostedit.list.convertList(node, listtype);
					break;
					case "textblock":
						//newblocks.concat( [ghostedit.list.convertTextblock (node, listtype)] );
						ghostedit.list.convertTextblock (node, listtype);
					break;
				}
			}
			return true;
		},
		
		
		tidy: function (list) {
			var prev, next, child, nextfirstchild, parent, handler;
			
			// If list contains no list items, remove list
			child = ghostedit.dom.getFirstChildGhostBlock(list);
			if (!child) {
				ghostedit.list.remove(list);
				return true;
			}
			
			// Else if previous GhostBlock is a list of same type, merge lists
			prev = ghostedit.dom.getPreviousSiblingGhostBlock(list);
			if (prev && prev.getAttribute("data-ghostedit-elemtype") === "list" && prev.tagName.toLowerCase() === list.tagName.toLowerCase()) {
				
				// Move list items to previous list
				while (child = ghostedit.dom.getFirstChildGhostBlock(list)) {
					prev.appendChild (child);
				}
				
				// Remove current list
				ghostedit.list.remove(list);
				
				// Set selection to first item in next list
				lasso().setCaretToEnd(ghostedit.dom.getFirstChildGhostBlock(prev)).select();
				ghostedit.selection.save();
				
				// Call tidy function on previous list
				ghostedit.list.tidy (prev);
				
				return true;
			}
			
			// Else if next GhostBlock is a list of same type, merge lists
			next = ghostedit.dom.getNextSiblingGhostBlock(list);
			if (next && next.getAttribute("data-ghostedit-elemtype") === "list" && next.tagName.toLowerCase() === list.tagName.toLowerCase()) {
				
				// If next list has list items, move list items to next list, else remove next list
				if (nextfirstchild = ghostedit.dom.getFirstChildGhostBlock(next)) {
					
					// Move list items to next list
					while (child = ghostedit.dom.getFirstChildGhostBlock(list)) {
						next.insertBefore (child, nextfirstchild);
					}
					
					// Remove current list
					ghostedit.list.remove(list);
					
					// Set selection to first item in next list
					lasso().setCaretToEnd(ghostedit.dom.getFirstChildGhostBlock(next)).select();
					ghostedit.selection.save();
					
					// Call tidy function on next list
					ghostedit.list.tidy (next);
					
					return true;
				}
				else {
					// Remove next list
					ghostedit.list.remove(next);
					return true;
				}
			}
			return true;
		},
		
		applydropevents: function(elem) {
			elem.ondragenter = function () { return false; };
			elem.ondragleave = function () { return false; };
			elem.ondragover = function () { return false; };
			elem.ondrop = function(e){
				var elem, elemid;
				elemid = e.dataTransfer.getData("text/plain") || e.srcElement.id;
				elem = document.getElementById(elemid);
				elem.parentNode.insertBefore(elem, this);
				ghostedit.image.focus(elem);
				ghostedit.util.cancelEvent(e);
					};
			elem.onresizestart = function(e){ return ghostedit.util.cancelEvent(e); };
		}
	}
}

ghostedit.plugins.register("link","image", "list");
