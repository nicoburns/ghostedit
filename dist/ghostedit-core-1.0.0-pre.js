/* Lasso range library

Name:				Lasso
Description:			Lightweight, crossbrowser javascript library for creating and modifying ranges. Used by the GhostEdit editor.
Licence:			Dual licensed under MIT and LGPL licenses.
Browser Support:		Internet Explorer 6+, Mozilla Firefox 3.5+, Google Chrome, Apple Safari 3+, Opera 10.50+, Any other browser that supports DOMranges or TextRanges
Author:				Nico Burns <nico@nicoburns.com>
Website:			http://ghosted.it/lasso
Version:			1.5.0
Release Date:			---

Changelog:
Changes to the node selection functions.
Change to deleteContents() for TextRange browsers (ie)
Added clearSelection();

Available methods:
	Native range:
		setFromNative(nativerange)
		getNative()
	Selection:
		setToSelection()
		select()
		clearSelection()
	Modify range:
		reset()
		setStartToRangeStart(lasso object | range)
		setStartToRangeEnd(lasso object | range)
		setEndToRangeStart(lasso object | range)
		setStartToRangeEnd(lasso object | range)
	Modify content:
		deleteContents()
		pasteText(string)
	Get content:
		getText()
		extractText()
		getHTML()
		extractHTML()
	Node/element:
		selectNode(node)
		selectNodeContents(node) [only works on block elements in ie8]
		setCaretToStart(elem | elemid)
		setCaretToEnd(elem | elemid)
	Range information:
		isCollapsed()
		compareEndPoints()
		getStartNode()
		getEndNode()
		getParentNode()
		getStartElement()
		getEndElement()
	Save & restore:
		saveToDOM()
		restoreFromDOM()
		isSavedRange()
		removeDOMmarkers()
		bookmarkify() [ie <= 8 only]
		unbookmarkify() [ie <= 8 only]
	other:
		clone()
		inspect()


Example usage:

	1. Set the caret to the end of an element with ID 'testelem':
	lasso().setCaretToEnd('testelem').select();

	2. Get the currently selected text
	lasso().setToSelection().getText();
*/

window.lasso = function() {
	//define local range object to be returned at end
	var r = {
		saved: null,
		endpoint: null,
		startpoint: null,
		bookmark: null,
		textrange: false,
		domrange: false,
		isLassoObject: true
	},
	lasso = window.lasso,
	console = window.console || {};
	console.log = console.log || function () {};
		
	r.init = r.reset = r.create = function () {
		if(document.createRange) {
			r.textrange = false;
			r.saved = document.createRange();
		}
		else if (document.selection) {
			r.textrange = true;
			r.saved = document.body.createTextRange();
		}
		r.bookmark = false;
		r.domrange = !r.textrange;
		return r;
	};
	
	r.setToEmpty = function () {
		if (r.domrange) {
			r.saved = document.createRange();
		}
		else if (r.textrange) {
			r.saved = document.body.createTextRange();
		}
		return r;
	};
	
	
	/* Native Range Functions */
	
	r.setFromNative = function (nativerange) {
		r.saved = nativerange;
		return r;
	};
	
	r.getNative = function () {
		return r.saved;
	};
	
	
	/* Selection Functions */
	
	r.setToSelection = function () {
		var s;
		if(r.domrange) {
			s = window.getSelection();
			if(s.rangeCount > 0) {
				r.saved = s.getRangeAt(0).cloneRange();
			}
		}
		else if (r.textrange) {
			r.saved = document.selection.createRange();
		}
		return r;
	};
	
	r.select = function () {
		if (r.domrange) {
			var s = window.getSelection();
			if (s.rangeCount > 0) s.removeAllRanges();
			s.addRange(r.saved);
		}
		else if (r.textrange) {
			r.saved.select();
		}
		return r;
	};
	
	r.clearSelection = function () {
		if (r.domrange) {
			var s = window.getSelection();
			if (s.rangeCount > 0) s.removeAllRanges();
		}
		else if (r.textrange) {
			document.selection.empty();
		}
		return r;
	};
	
	
	/* Modify Range Functions */
	
	r.collapseToStart = function () {
		r.saved.collapse(true);
		return r;
	};
	
	r.collapseToEnd = function () {
		r.saved.collapse(false);
		return r;
	};
	
	r.setStartToRangeStart = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.startContainer, range.startOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("StartToStart", range);
		}
		return r;
	};
	
	r.setStartToRangeEnd = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("StartToEnd", range);
		}
		return r;
	};
	
	r.setEndToRangeStart = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("EndToStart", range);
		}
		return r;
	};
	
	r.setEndToRangeEnd = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setEnd(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("EndToEnd", range);
		}
		return r;
	};
	
	
	/* Modify Content Functions */
	
	r.deleteContents = function () {
		if (r.domrange) {
			r.saved.deleteContents();
		}
		else if (r.textrange) {
			/* TextRange deleting seems quite buggy - these *should* work, but text = "" has been most successful so far
			try {
				r.saved.pasteHTML("");
			}
			catch (e) {
				r.saved.execCommand("delete");
			}*/
			r.saved.text = "";
		}
		return r;
	};
	
	r.pasteText = function (text, collapse) {
		if(typeof collapse === "undefined") collapse = true;
		
		r.deleteContents();
		
		if (r.domrange) {
			var txt = document.createTextNode(text);
			r.saved.insertNode(txt);
			r.reset().selectNodeContents(txt);
		}
		else if (r.textrange) {
			r.saved.pasteHTML(text);
		}
		
		if (collapse) r.collapseToEnd();
		r.select();
		
		return r;
	};
	
	r.insertNode  = function (node, collapse) {
		var div;
		if(typeof collapse === "undefined") collapse = true;
		
		r.deleteContents();
		
		if (r.domrange) {
			r.saved.insertNode(node);
			r.setToEmpty().selectNodeContents(node);
		}
		else if (r.textrange) {
			div = document.createNode("div");
			div.appendChild(node);
			r.saved.pasteHTML(div.innerHTML);
		}
		
		if (collapse) r.collapseToEnd();
		//r.select();
		
		return r;
	};
	
	/* Get Content Functions */

	r.getText = function () {
		if (r.domrange) {
			return r.saved.toString();
		}
		else if (r.textrange) {
			return r.saved.text;
		}
	};

	r.extractText = function () {
		var text = r.getText();
		r.deleteContents();
		return text;
	};
	
	r.getHTML = function () {
		var tempelem, docfrag;
		if (r.domrange) {
			docfrag = r.saved.cloneContents();
			tempelem = document.createElement("div");
			tempelem.appendChild(docfrag);
			return tempelem.innerHTML;
		}
		else if (r.textrange) {
			return r.saved.htmlText;
		}
	};
	
	r.extractHTML = function () {
		var html = r.getHTML();
		r.deleteContents();
		return html;
	};
	
	
	/* Node/Element Functions */
	
	r.actualSelectNode = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNode(elem);
		}
		else if (r.textrange) {
			r.saved.moveToElementText(elem);
		}
		return r;
	};
		
	r.selectNode = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
		}
		else if (r.textrange) {
			r.saved.moveToElementText(elem);
		}
		return r;
	};
	
	//Only works on block elements in ie8
	r.selectNodeContents = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		var r1, r2;
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
		}
		else if (r.textrange) {
			r.saved.moveToElementText(elem);
			r1 = lasso().setCaretToStart(elem).getNative();
			r2 = lasso().setCaretToEnd(elem).getNative();
			r.saved.setEndPoint("StartToStart", r1);
			r.saved.setEndPoint("EndToStart", r2);
		}
		return r;
	};
	
	r.setCaretToStart = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
			r.saved.collapse(true);
		}
		else if (r.textrange) {
			/*elem.innerHTML = "<span id=\"range_marker\">&#x200b;</span>" + elem.innerHTML;
			r.selectNode('range_marker');//.deleteContents(); // For some reason .deleteContents() sometimes deletes too much
			document.getElementById('range_marker').parentNode.removeChild(document.getElementById('range_marker'));*/
			r.saved.moveToElementText(elem);
			r.saved.collapse(true);
		}
		return r;
	};
	
	r.setCaretToBlockStart = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
			r.saved.collapse(true);
		}
		else if (r.textrange) {
			r.saved.moveToElementText(elem);
			r.saved.collapse(false);
			
			r.saved.move("character", -(elem.innerText.length + 1));
		}
		return r;
	};
	
	r.selectInlineStart = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
			r.saved.collapse(true).select();
		}
		else if (r.textrange) {
			elem.innerHTML = "a" + elem.innerHTML; // The 'a' is arbitrary, any single character will work
    
			r.saved.moveToElementText(elem);
			r.saved.collapse(false);
			
			r.saved.move("character", -(elem.innerText.length + 1));
			r.saved.moveEnd("character", 1);
			r.saved.select();
			r.saved.text = "";
		}
		return r;
	};
	
	r.setCaretToEnd = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
			r.saved.collapse(false);
		}
		else if (r.textrange) {
			/*elem.innerHTML = elem.innerHTML + "<span id=\"range_marker\">&#x200b;</span>";
			r.selectNode('range_marker');//.deleteContents();
			document.getElementById('range_marker').parentNode.removeChild(document.getElementById('range_marker'));*/
			r.saved.moveToElementText(elem);
			r.saved.collapse(false);
		}
		return r;
	};

	
	/* Range Information Functions */
	
	r.isCollapsed = function () {
		if (r.domrange) {
			return r.saved.collapsed;
		}
		else if (r.textrange) {
			//return r.saved.compareEndPoints("StartToEnd", r.saved) === 0 ? true : false;
			return r.saved.isEqual(r.clone().collapseToStart().saved);
		}
	};
	
	r.compareEndPoints = function (how, range) {
		var R;
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			// Note that EndToStart and StartToEnd are reversed (to make compatible with ie order)
			R = window.Range;
			var howlookup = {"StartToStart": R.START_TO_START,
						"StartToEnd": R.END_TO_START,
						"EndToStart": R.START_TO_END,
						"EndToEnd": R.END_TO_END};				
			how = howlookup[how];
			return r.saved.compareBoundaryPoints(how, range);
		}
		else if (r.textrange) {
			return r.saved.compareEndPoints(how, range);
		}
	};
	
	r.isEqualTo = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.compareEndPoints("StartToStart", range) !== 0) return false;
		if (r.compareEndPoints("EndToEnd", range) !== 0) return false;
		
		return true;
	};
	
	r.getStartNode = function () {
		if (r.domrange) {
			return r.saved.startContainer;
		}
		else if (r.textrange) {
			var range = r.saved.duplicate();
			range.collapse(true);
			return range.parentElement();
		}
	};
	
	r.getEndNode = function () {
		if (r.domrange) {
			return r.saved.endContainer;
		}
		else if (r.textrange) {
			var range = r.saved.duplicate();
			range.collapse(false);
			return range.parentElement();
		}
	};
	
	r.getParentNode = function () {
		if (r.domrange) {
			return r.saved.commonAncestorContainer;
		}
		else if (r.textrange) {
			return r.saved.parentElement();
		}
	};
	
	r.getStartElement = function () {
		return r.util.getParentElement( r.getStartNode() );
	};
	
	r.getEndElement = function () {
		return r.util.getParentElement( r.getEndNode() );
	};
	
	r.getParentElement = function () {
		if (r.domrange) {
			return r.util.getParentElement( r.saved.commonAncestorContainer);
		}
		else if (r.textrange) {
			return r.saved.parentElement();
		}
	};


	/* Clone Function */
	
	r.clone = function () {
		var r2 = lasso();
		if(r.domrange) {
			r2.saved = r.saved.cloneRange();
		}
		else if (r.textrange) {
			r2.saved = r.saved.duplicate();
		}
		r2.bookmark = r.cloneBookmark();
		return r2;
	};
	
	/* Save and Restore Functions (save to DOM) */
	
	r.saveToDOM = function (id) {
		var start, end, smark, emark, collapsed;
		if (!id) id = "lasso";
		
		r.removeDOMmarkers(id);
		
		collapsed = r.isCollapsed();
		
		start = r.clone().collapseToStart().getNative();
		if (!collapsed) end = r.clone().collapseToEnd().getNative();
		
		if (r.domrange) {
			smark = document.createElement("span");
			smark.innerHTML = "&#x200b";
			smark.id = id + "_range_start";
			start.insertNode(smark);
			if (!collapsed) {
				emark = document.createElement("span");
				emark.innerHTML = "&#x200b";
				emark.id = id + "_range_end";
				end.insertNode(emark);
			}
		}
		else if (r.textrange) {
			start.pasteHTML("<span id=\"" + id + "_range_start\">&#x200b;</span>");
			if (!collapsed) {
				end.pasteHTML("<span id=\"" + id + "_range_end\">&#x200b;</span>");
			}
		}
		
		// Restore in case selection is lost by changing DOM above
		r = r.restoreFromDOM(id, false) || r.reset();
		
		return r;
	};
	
	r.restoreFromDOM = function (id, removemarkers) {
		var start, end, smark, emark;
		if (!id || id === "" || id === true || id === false) id = "lasso";
		if (id === true) removemarkers = true;
		
		smark = document.getElementById(id + "_range_start");
		emark = document.getElementById(id + "_range_end");

		if (!smark) return false;
		
		start = lasso().actualSelectNode(smark).collapseToEnd();
		if (removemarkers !== false) smark.parentNode.removeChild(smark);
		
		if (emark) {
			end= lasso().actualSelectNode(emark).collapseToStart();
			if (removemarkers !== false) emark.parentNode.removeChild(emark);
		}
		else {
			end = start;
		}
		
		r = lasso().setStartToRangeStart(start).setEndToRangeEnd(end);
		
		return r;
	};
	
	r.isSavedRange = function (id) {
		if (!id) id = "lasso";
		
		return (document.getElementById(id + "_range_start")) ? true : false;
	};
	
	r.removeDOMmarkers = function (id) {
		var smark, emark;
		if (!id) id = "lasso";
		
		smark = document.getElementById(id + "_range_start");
		emark = document.getElementById(id + "_range_end");
		
		if (smark) smark.parentNode.removeChild(smark);
		if (emark) emark.parentNode.removeChild(emark);
	};
	
	
	/* More save and restore functions (save reference from root node) */
	
	r.bookmarkify = function (rootnode) {
		if (r.domrange) {
			var node, startnodeoffsets, endnodeoffsets, b = {};
			if (!rootnode || !rootnode.nodeType) return r;
			
			// Save start and end offset to bookmark
			b.startoffset = r.saved.startOffset;
			b.endoffset = r.saved.endOffset;
			
			// Get start node offset path relative to rootnode
			startnodeoffsets = [];
			node = r.saved.startContainer;
			while (node !== rootnode) {
				startnodeoffsets.unshift(r.util.getNodeOffset(node));
				node = node.parentNode;
				if (node === null) return r;
			}
			
			// Get end node offset path relative to rootnode
			endnodeoffsets = [];
			node = r.saved.endContainer;	
			while (node !== rootnode) {
				endnodeoffsets.unshift(r.util.getNodeOffset(node));
				node = node.parentNode;
				if (node === null) return r;
			}
			
			// Save paths to bookmark
			b.startnodeoffsets = startnodeoffsets.join("-");
			b.endnodeoffsets = endnodeoffsets.join("-");
			
			// Save rootnode to bookmark (used to show that bookmark exists)
			b.rootnode = rootnode;
			
			r.bookmark = b;
		}
		else if (r.textrange) {
			r.bookmark = r.saved.getBookmark();
		}
		return r;
	};
		
	r.unbookmarkify = function (rootnode) {
		var bookmark = r.bookmark;
		if (r.domrange) {
			var node, offset, startnodeoffsets, endnodeoffsets, startcontainer, endcontainer;
			if (!bookmark.rootnode || !rootnode) return r.setToEmpty();
			
			node = rootnode;
			startnodeoffsets = bookmark.startnodeoffsets.split("-");
			while (startnodeoffsets.length > 0) {
				offset = startnodeoffsets.shift();
				if (!node.childNodes || !node.childNodes[offset]) return r.setToEmpty();
				node = node.childNodes[offset];
			}
			startcontainer = node;
			
			node = rootnode;
			endnodeoffsets = bookmark.endnodeoffsets.split("-");
			while (endnodeoffsets.length > 0) {
				offset = endnodeoffsets.shift();
				if (!node.childNodes || !node.childNodes[offset]) return r.setToEmpty();
				node = node.childNodes[offset];
			}
			endcontainer = node;
			
			r.setToEmpty();
			r.saved.setStart(startcontainer, bookmark.startoffset);
			r.saved.setEnd(endcontainer, bookmark.endoffset);
		}
		else if (r.textrange) {
			if (r.bookmark) {
				r.reset().saved.moveToBookmark(bookmark);
				r.bookmarkify();
			}
		}
		return r;
	};
	
	r.clearBookmark = function () {
		r.bookmark = false;
		return r;
	};
	
	r.cloneBookmark = function (bookmark) {
		if (!bookmark) bookmark = r.bookmark;
		if (r.domrange) {
			return !bookmark ? false : {
				"rootnode": bookmark.rootnode,
				"startnodeoffsets": bookmark.startnodeoffsets,
				"endnodeoffsets": bookmark.endnodeoffsets,
				"startoffset": bookmark.startoffset,
				"endoffset": bookmark.endoffset
			};
		}
		else if (r.textrange) {
			if (!bookmark) return false;
			var r2 = lasso().getNative();
			return r2.moveToBookmark(bookmark) ? r2.getBookmark() : false;
		}
	};
	
	/* Inspection and debugging functions */
	
	r.inspect = function (logid) {
		console.log({
			logid: logid ? logid : "",
			startelement: r.getStartElement(),
			startnode: r.getStartNode(),
			endelement: r.getEndElement(),
			endnode: r.getEndNode(),
			text: r.getText(),
			html: r.getHTML(),
			parent: r.getParentNode()
		});
	};
	
	/* Utility, 'non-public' functions, used by other functions */
	
	r.util = { //Used only for next two functions (getStartElement and getEndElement)
		getParentElement: function (node) {
			if (node.nodeType !== 1) {
				while (node.nodeType !== 1) {
					node = node.parentNode;
					if (node === null) return null;
				}
			}
			return node;
		},
		
		getNodeOffset: function (node) {
			if (!node || !node.parentNode) return;
			var offset = 0;
			while (node.parentNode.childNodes[offset] !== node) {
				offset += 1;
			}
			return offset;
		}
	};
	
	r.init();
	return r;
};
(function(window, undefined) {
	// Create ghostedit object and global variables
	var _ghostedit = {
		version: "1.0pre",
		enabledplugins: [],
		ready: false,
		active: false,
		isEditing: true,
		blockElemId: 0,
		editorchrome: null,
		debug: false
	};
	
	// Empty object for references to any elements which need to be globally accesable to be stored on
	_ghostedit.el = {};
	
	// Empty api object for plugins and init functions to add to
	_ghostedit.api = {};
	
	// Empty object for plugins to be stored in
	_ghostedit.plugins = {};
	
	// Add the ghostedit object to the global namespace
	window.ghostedit = _ghostedit;
})(window);
(function(window, undefined) {
	window.ghostedit.init = function (source, options) {
		if (typeof source === "string") source = document.getElementById(source);
		var i, handler,
		ghostedit = window.ghostedit, 
		rootnode, uilayer, htmlelem;
		
		// Set up user options
		ghostedit.options = {};
		ghostedit.options = options || {};
		
		// Check for debug option (but only enable if log module exists)
		if (ghostedit.options.debug) {
			ghostedit.debug = true;
		}
		
		// Detect whether we need to add extra br's to work around firefox's bugs (also used for webkit and opera)
		ghostedit.browserEngine = ghostedit.util.detectEngines();
		ghostedit.useMozBr = (ghostedit.browserEngine.gecko !== 0 || ghostedit.browserEngine.webkit !== 0 || ghostedit.browserEngine.opera !== 0);
		
		//Hide div containing original content
		source.style.display = 'none';
		ghostedit.el.source = source;
		
		// Create contextual ui layer
		uilayer = document.createElement("div");
		uilayer.id = "ghostedit_uilayer";
		uilayer.className = "ghostedit_uilayer";
		uilayer.innerHTML = "<span style='position: absolute; display: none;left: 0; top: 0;line-height: 0'>ie bug fix</span>";
		source.parentNode.insertBefore(uilayer, source);
		ghostedit.el.uilayer = uilayer;
		
		// Run init events for core modules
		ghostedit.history.init();
		ghostedit.inout.init();
		ghostedit.clipboard.init();
		
		// Enable plugins
		ghostedit.options.plugins = ghostedit.options.plugins || [];
		ghostedit.options.plugins.unshift("container", "textblock");
		if (ghostedit.options.plugins) {
			for (i = 0; i < ghostedit.options.plugins.length; i++) {
				ghostedit.api.plugin.enable(ghostedit.options.plugins[i]);
			}
		}
		
		// Send init event to plugins (and core modules)
		ghostedit.event.trigger("init");
		
		// Import initial content
		rootnode = ghostedit.inout.importHTML(source);
		source.parentNode.insertBefore(rootnode, source);
		ghostedit.el.rootnode = rootnode;
		
		// Focus the editor
		handler = rootnode.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].focus(rootnode);
		
		// Make sure that FF uses tags not CSS, and doesn't show resize handles on images
		try{document.execCommand("styleWithCSS", false, false);} catch(err){}//makes FF use tags for contenteditable
		try{document.execCommand("enableObjectResizing", false, false);} catch(err){}//stops resize handles being resizeable in FF
		
		// Save selection & setup undo
		ghostedit.selection.save();
		ghostedit.history.reset();
		ghostedit.history.saveUndoState();
		
		// Attach event handlers to html element
		htmlelem = document.getElementsByTagName("html")[0];
		ghostedit.util.addEvent(htmlelem, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "drop", ghostedit.util.cancelEvent);
		
		// Attach handlers to rootnode
		ghostedit.util.addEvent(rootnode, "click", ghostedit.selection.save);
		ghostedit.util.addEvent(rootnode, "mouseup", ghostedit.selection.save);
		ghostedit.util.addEvent(rootnode, "keyup", ghostedit.selection.save);
		ghostedit.util.addEvent(rootnode, "keydown", function (event) {ghostedit.event.keydown(this, event); });
		ghostedit.util.addEvent(rootnode, "keypress", function (event) {ghostedit.event.keypress(this, event); });
		ghostedit.util.addEvent(rootnode, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(rootnode, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(rootnode, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(rootnode, "drop", ghostedit.util.cancelEvent);
		
		// Focus rootnode
		rootnode.focus();
		ghostedit.plugins.container.focus(rootnode);
		
		ghostedit.ready = true;
		ghostedit.event.trigger("init:after");
	};
})(window);
(function (window, undefined) {

	var _plugins = {},
	ghostedit = window.ghostedit;
	
	_plugins.register = function(name, object) {
		if (ghostedit.plugins[name]) return false;
		
		ghostedit.plugins[name] = object;
		
		return true;
	};
	
	_plugins.enable = function (name) {
		if (!ghostedit.plugins[name]) return false;
		if (ghostedit.enabledplugins[name]) _plugins.disable(name);
		
		var plugin = ghostedit.plugins[name];
		if (typeof(plugin.enable) === "function") {
			plugin.enable();
		}
		ghostedit.enabledplugins[name] = true;
	};
	
	_plugins.disable = function (name) {
		if (!ghostedit.enabledplugins[name] || !ghostedit.plugins[name]) return false;
		
		var plugin = ghostedit.plugins[name];
		if (typeof(plugin.disable) === "function") {
			plugin.disable();
		}
		ghostedit.enabledplugins[name] = false;
	};
	
	window.ghostedit.api.plugin = _plugins;
})(window);
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
(function(window, undefined) {
	
	var _event = {
		listeners: [],
		listenerid: 0,
		eventtypes: [],
		cancelKeypress: false //allows onkeypress event to be cancelled from onkeydown event.
	},
	ghostedit = window.ghostedit;
	
	// Used to capture non-repeating keyboard event (also, non-printing keys don't fire onkeypress in most browsers)
	_event.keydown = function (elem, e) {
		var keycode, ghostblock, handler, handled;
		ghostedit.selection.save(false);
		
		e = !(e && e.istest) && window.event ? window.event : e;
		keycode = e.keyCode !== null ? e.keyCode : e.charCode;
		
		_event.trigger("input:keydown", {"event": e, "keycode": keycode});
		
		// Global shortcuts
		switch(keycode) {
			case 8: //backspace
			case 46: // delete key
				_event.cancelKeypress = false;
				if(ghostedit.selection.savedRange.isCollapsed() === false) {
					ghostedit.history.saveUndoState();
					
					ghostedit.selection.deleteContents( (keycode === 8) ? "collapsetostart" : "collapsetoend" );
					
					ghostedit.history.saveUndoState();
					_event.cancelKeypress = true;//otherwise opera fires default backspace event onkeyPRESS (not onkeyDOWN)
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 83: //ctrl-s
				if (e.ctrlKey){
					ghostedit.api.save();
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 66: //ctrl-b
				if (e.ctrlKey) {
					ghostedit.plugins.textblock.format.bold ();
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 73: //ctrl-i
				if (e.ctrlKey && !e.shiftKey) {
					ghostedit.plugins.textblock.format.italic ();
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 85: //ctrl-u
				if (e.ctrlKey) {
					ghostedit.plugins.textblock.format.underline ();
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
		}
		
		// If not handled by one of above, pass to plugin keydown handlers
		ghostblock = ghostedit.selection.getContainingGhostBlock();
		while (true) {
			// If plugin for the GhostBlock containing the selection has an 'event.keydown' function, call it
			handler = ghostblock.getAttribute("data-ghostedit-handler");
			if (ghostedit.plugins[handler] && ghostedit.plugins[handler].event && ghostedit.plugins[handler].event.keydown) {
				handled = ghostedit.plugins[handler].event.keydown(ghostblock, keycode, e);
				if (handled === true) break;
			}
			
			// If above GhostBlock doesn't handle the keypress, send event to it's parent
			ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
			if (!ghostblock) break;
		}
		
		ghostedit.selection.save();
		return true;
	};

	_event.keypress = function (elem, e) {
		var keycode, ghostblock, handler, handled, currentDocLen, savedDocLen;
		ghostedit.selection.save();
		
		currentDocLen = ghostedit.el.rootnode.innerHTML.length;
		savedDocLen = ghostedit.history.undoData[ghostedit.history.undoPoint] !== undefined ? ghostedit.history.undoData[ghostedit.history.undoPoint].content.string.length : 0;
		//if (currentDocLen - savedDocLen >= 20 || savedDocLen - currentDocLen >= 20) ghostedit.history.saveUndoState();
		
		e = !(e && e.istest) && window.event ? window.event : e;
		keycode = e.keyCode !== null ? e.keyCode : e.charCode;
		
		_event.trigger("input:keydown", {"event": e, "keycode": keycode});
		
		if (ghostedit.selection.saved.type !== "none" && !ghostedit.selection.savedRange.isCollapsed() && !e.ctrlKey) {
			ghostedit.selection.deleteContents("collapsetostart");
		}
		
		
		// Global keyevents
		switch(keycode) {
			case 8: //cancel backspace event in opera if cancelKeypress = true
				if (_event.cancelKeypress === true) {
					_event.cancelKeypress = false;
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 13: // Enter (don't allow default action for enter to happen)
				ghostedit.util.cancelEvent ( e );
			break;
		}
		
		// If not handled by one of above, pass to plugin keypress handlers
		ghostblock = ghostedit.selection.getContainingGhostBlock();
		while (true) {
			// If plugin for the GhostBlock containing the selection has an 'event.keypress' function, call it
			handler = ghostblock.getAttribute("data-ghostedit-handler");
			if (ghostedit.plugins[handler] && ghostedit.plugins[handler].event && ghostedit.plugins[handler].event.keypress) {
				handled = ghostedit.plugins[handler].event.keypress(ghostblock, keycode, e);
				if (handled === true) break;
			}
			
			// If above GhostBlock doesn't handle the keypress, send event to it's parent
			ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
			if (!ghostblock) break;
		}
		
		
		ghostedit.selection.save();
		return true;
	};

	_event.addListener = function (event, callback, revokekey) {
		var listeners, eventtypes, isnewevent, i;
		if (typeof(callback) !== "function") return false;
		
		// Check if array for that event needs to be created
		listeners = _event.listeners;
		if (!listeners[event] || typeof(listeners[event]) !== "object" || !(listeners[event] instanceof Array)) {
			listeners[event] = [];
		}
		
		// Add event to list of events
		eventtypes = _event.eventtypes;
		isnewevent = true;
		for (i = 0; i < eventtypes.length; i++) {
			if (eventtypes[i] === event) {
				isnewevent = false;
				break;
			}
		}
		if (isnewevent) eventtypes.push(event);
		
		_event.listenerid++;
		listeners[event].push({"id": _event.listenerid, "callback": callback, "revokekey": revokekey});
		return _event.listenerid;
	};

	_event.removeListener = function (event, listenerid) {
		var listeners = _event.listeners, i, newlist = [];
		
		if(!listeners[event]) return;
		
		for (i = 0; i < listeners[event].length; i++) {
			if (listeners[event].id !== listenerid) {
				newlist.push(listeners[event][i]);
			}
		}
		
		listeners[event] = newlist;
	};

	_event.removeAllListeners = function (revokekey) {
		var listeners, eventtypes, event, i, j, newlist = [];
		if(!revokekey) return;
		
		listeners = _event.listeners;
		eventtypes = _event.eventtypes;
		
		for (i = 0; i < eventtypes.length; i++) {
			event = eventtypes[i];
			for (j = 0; j < listeners[event].length; j++) {
				if(!listeners[event][j].revokekey || listeners[event][j].revokekey !== revokekey) {
					newlist.push(listeners[event][j]);
				}
			}
			listeners[event] = ghostedit.util.cloneObject(newlist);
			newlist = [];
		}
	};

	_event.trigger = function (event, params) {
		var listeners = _event.listeners, i;
		if (params === undefined) params = {};
		if (!listeners[event] || typeof(listeners[event]) !== "object" || !(listeners[event] instanceof Array)) return;
		
		if (ghostedit.debug) {
			window.console.log(event);
			window.console.log(params);
		}
		
		for (i = 0; i < listeners[event].length; i++) {
			listeners[event][i].callback.call(this, params);
		}
	};

	_event.sendBackwards = function (eventtype, source, params) {
		var target = false, tracker, result, direction;
		if (!params) params = {};
		if (!ghostedit.dom.isGhostBlock(source)) return false;
		
		tracker = source; //tracks currently tried targets
		
		while(true) {
			
			if ((target = ghostedit.dom.getPreviousSiblingGhostBlock(tracker))) {
				direction = "ahead";
			}
			else if ((target = ghostedit.dom.getParentGhostBlock(tracker))) {
				direction = "top";
			}
			
			result = _event.send (eventtype, target, direction, params);
			if (!result) return false;
			else if (result.handled === true) return true;
			
			tracker = target;
		}
	};

	_event.sendForwards = function (eventtype, source, params) {
		var target = false, tracker, result, direction;
		if (!params) params = {};
		if (!ghostedit.dom.isGhostBlock(source)) return false;
		
		tracker = source; //tracks currently tried targets
		
		while(true) {
			
			if ((target = ghostedit.dom.getNextSiblingGhostBlock(tracker))) {
				direction = "behind";
			}
			else if ((target = ghostedit.dom.getParentGhostBlock(tracker))) {
				direction = "bottom";
			}
			
			result = _event.send (eventtype, target, direction, params);
			if (!result) return false;
			else if (result.handled === true) return true;
			
			tracker = target;
		}
	};

	_event.send = function (eventtype, target, fromdirection, params) {
		var handler, handled;

		if (!target) return false; // = no previous/next GhostBlock

		handler = target.getAttribute("data-ghostedit-handler");
		if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].dom || !ghostedit.plugins[handler].dom.deleteevent) {
			return {"handled": false}; // = no handler for this elemtype
		}
		
		handled = ghostedit.plugins[handler].dom.deleteevent (target, fromdirection, params);

		return {"handled": handled};
		
	};
	
	window.ghostedit.event = _event;
})(window);
(function(window, undefined) {
	
	var _dom = {};
	
	_dom.getNodeOffset = function (node) {
		var offset, nodelist;
		
		if (!node || !node.parentNode) return;
		
		offset = 0;
		nodelist = node.parentNode.childNodes;
		
		while (nodelist[offset] !== node) {
			offset += 1;
		}
		return offset;
	};

	_dom.extractContent = function (node) {
		var frag = document.createDocumentFragment(), child;
		while ( (child = node.firstChild) ) {
			frag.appendChild(child);
		}
		return frag;
	};

	_dom.cloneContent = function (node) {
		var child, i, frag = document.createDocumentFragment();
		for (i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes[i];
			frag.appendChild(child.cloneNode(true));
		}
		return frag;
	};

	_dom.parse = function (node, rules) {
		var parsednode = false, nodes, parsedchild, i, j, value, text, tagname, tagrules, attribute, style;
		if (!node || !rules || !node.nodeType) return false;
		
		rules.textnode = rules.textnode || {};
		rules.tags = rules.tags || {};
		
		// Handle textnodes
		if (node.nodeType === 3) {
			text = (rules.textnode.clean) ? node.nodeValue.replace(/[\n\r\t]/g,"") : node.nodeValue;
			return (text.length > 0) ? document.createTextNode(text) : false;
		}
		
		// Handle not-element case (textnodes already handled)
		if (node.nodeType !== 1) return false;
		
		// Get rules for tag, if none default to content only
		tagname = node.tagName.toLowerCase();
		tagrules = {"contentsonly": true};
		if (rules.tags[tagname]) {
			tagrules = rules.tags[tagname];
			if (typeof tagrules.template === "string") tagrules = tagrules.template;
			if (typeof tagrules === "string" && rules.templates[tagrules]) tagrules = rules.templates[tagrules];
			if (typeof tagrules === "string") return false;
		}
		
		
		// If "contentsonly" flag set, create document fragment, else create element of same type as node
		parsednode = tagrules.contentsonly ? document.createDocumentFragment() : document.createElement(node.tagName.toLowerCase());
		
		// Unless "ignorechildren" flag set, recurse on children
		if (!tagrules.ignorechildren) {
			nodes = node.childNodes;
			for (i = 0; i < nodes.length; i++) {
				parsedchild = _dom.parse(nodes[i], rules);
				if (parsedchild) {
					parsednode.appendChild(parsedchild);
				}
			}
		}
		
		// Return here if contents only (no need to copy attributes if no node to copy to)
		if (tagrules.contentsonly) return (parsednode.childNodes.length > 0) ? parsednode : false;
		
		// If attributes specified, copy specified attributes
		if (tagrules.attributes) {
			for (i = 0; i < tagrules.attributes.length; i++) {
				attribute = tagrules.attributes[i];
				
				// Handle simple (no rules) case
				if (typeof attribute === "string") attribute = {"name": attribute};
				
				// Get value of attribute on source node
				if (typeof attribute.name !== "string") break;
				value  = attribute.value || (attribute.name === "class") ? node.className : node.getAttribute(attribute.name);
				if (value === undefined) break;
				attribute.copy = true;
				
				// If allowedvalues are specified, check if value is correct
				if (attribute.allowedvalues) {
					attribute.copy = false;
					for (j = 0; j < attribute.allowedvalues.length; j++) {
						if (attribute.allowedvalues[i] === value){
							attribute.copy = true;
							break;
						}
					}
				}
				
				// If all checks passed, set attribute on new node
				if (attribute.copy) {
					if (attribute.name === "class") {
						parsednode.className = value;
					}
					else {
						parsednode.setAttribute(attribute.name, value);
					}
				}
			}
		}
		
		
		// If styles specified, copy specified attributes
		if (tagrules.styles) {
			for (i = 0; i < tagrules.styles.length; i++) {
				style = tagrules.styles[i];
				
				// Handle simple (no rules) case
				if (typeof style === "string") style = {"name": style};
				
				// Get value of style on source node
				if (typeof style.name !== "string") break;
				if (style.name === "float") style.name = (node.style.cssFloat) ? "cssFloat" : "styleFloat";
				value  = style.value || node.style[style.name];
				if (value === undefined) break;
				style.copy = true;
				
				// If allowedvalues are specified, check if value is correct
				if (style.allowedvalues) {
					style.copy = false;
					for (j = 0; j < style.allowedvalues.length; j++) {
						if (style.allowedvalues[j] === value) {
							style.copy = true;
							break;
						}
					}
				}
				
				// If all checks passed, set style on new node
				if (style.copy) parsednode.style[style.name] = value;
			}
		}
		
		return parsednode;
	};

	_dom./*compareNodes = function (node1, node2) {
		var node;
		
		// If node1 is a documentFragment, wrap in an element
		if (n1.nodeType === 11) {
			node = document.createElement("div");
			node.appendChild(nodeOrFrag);
			node1 = node;
		}
		
		// If node2 is a documentFragment, wrap in an element
		if (n2.nodeType === 11) {
			node = document.createElement("div");
			node.appendChild(nodeOrFrag);
			node2 = node;
		}
		
		function getNextNode (nodelist, current) {
			
		}
		
		nodes1 = node1.getElementsByTagName(*);
		
		
	},*/
	
	isGhostBlock = function (node) {
		if (!node || !node.nodeType || node.nodeType !== 1) return false;
		
		var ghosttype = node.getAttribute("data-ghostedit-elemtype");
		
		return (ghosttype !== undefined && ghosttype !== false && ghosttype !== null) ? true : false; 
	};

	_dom.isChildGhostBlock = function (elem, parent) {
		var i;
		
		if (!elem || !parent || !parent.childNodes) return false;
		if (elem.nodeType !== 1) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === undefined) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === false) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === null) return false;
		var childblocks = parent.childNodes;
		for(i = 0; i < childblocks.length; i += 1) {
			if (elem === childblocks[i]) {
				return true;
			}
		}
		return false;
	};

	_dom.isGhostToplevel = function (node) {
		return (node && node.getAttribute("data-ghostedit-isrootnode") === true) ? true : false;
	};

	_dom.getParentGhostBlock = function (node) {
		
		if (!node) return false;
		
		do {
			node = node.parentNode;
			if (node === null) return false;
		}
		while (!_dom.isGhostBlock(node));
		
		return node;
	};

	_dom.getFirstChildGhostBlock = function (node) {
		var children, i;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse forwards through DOM until first GhostBlock is found.
		children = node.childNodes;
		
		for (i = 0; i < children.length; i += 1) {
			if (_dom.isGhostBlock(children[i])) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getLastChildGhostBlock = function (node) {
		var children, i;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
		children = node.childNodes;
		
		for (i = children.length -1; i >= 0; i -= 1) {
			if (_dom.isGhostBlock(children[i])) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getPreviousSiblingGhostBlock = function (node) {
		var parent, offset, siblings;
		
		if (!node || !node.parentNode) return false;			
		
		// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
		parent = node.parentNode;
		offset = _dom.getNodeOffset (node) - 1;
		siblings = parent.childNodes;
		
		do {
			if (_dom.isGhostBlock(siblings[offset]) === true)  {
				return siblings[offset];
			}
			offset -= 1;
		}
		while (offset >= 0);
		
		return false;
	};

	_dom.getNextSiblingGhostBlock = function (node) {
		var parent, offset, siblings;
		
		if (!node || !node.parentNode) return false;			
		
		// Otherwise, recurse forwards through DOM until next GhostBlock is found.
		parent = node.parentNode;
		offset = _dom.getNodeOffset (node) + 1;
		siblings = parent.childNodes;
		
		do {
			if (_dom.isGhostBlock(siblings[offset]) === true)  {
				return siblings[offset];
			}
			offset += 1;
		}
		while (offset < siblings.length);
		
		return false;
	};

	_dom.getParentElement = function (node) {
		if (node.nodeType !== 1) {
			while (node.nodeType !== 1) {
				node = node.parentNode;
				if (node === null) return null;
			}
		}
		return node;
	};

	_dom.isDescendant = function (parent, child) {
		var node = child.parentNode;
		while (node !== null) {
			if (node === parent) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	};

	_dom.getFirstChildElement = function (node) {
		var children, i;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse forwards through DOM until next element is found.
		children = node.childNodes;
		
		for (i = 0; i < children.length; i += 1) {
			if (children[i].nodeType === 1) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getCertainParent = function (condition, elem) {
		var args = [].slice.call(arguments);
		args.shift();
		if (!condition.apply(this, args)) {
			while (!condition.apply(this, args)) {
				elem = elem.parentNode;
				args[0] = elem;
				if (elem === null) return false;
			}
		}
		return elem;
	};
	
	window.ghostedit.dom = _dom;
})(window);
(function(window, undefined) {
		
		var _selection = {
			savedRange: null,
			nodepath: [],
			saved: {type: "none", data: null},
			archived: {type: "none", data: null}
		},
		ghostedit = window.ghostedit,
		lasso = window.lasso;
		
		_selection.save = function (updateui) {
			var sel;
			if (updateui !== false) updateui = true;
			sel = lasso().setToSelection();
			
			if (!_selection.isInEditdiv(sel.getStartNode())) {
				_selection.saved.type = "none";
				return false;
			}
			else {
				//Save current selection to range
				_selection.saved.type = "textblock";
				_selection.saved.data = sel;//.bookmarkify(ghostedit.el.rootnode);
				
				// Save to legacy variable
				_selection.savedRange = _selection.saved.data;
				
				ghostedit.event.trigger("selection:change");
				
				_selection.updatePathInfo();
				if (updateui) ghostedit.event.trigger("ui:update");
				return true;
			}
		};
		
		_selection.set = function (type, data, updateui) {
			if (updateui !== false) updateui = true;
			if (typeof type !== "string") return;
			
			// Update selection variables
			_selection.saved.type = type;
			_selection.saved.data = data;
				
			// Save to legacy variable
			_selection.savedRange = _selection.saved.data;
			
			// Update path information
			_selection.updatePathInfo();
			
			// Send events
			ghostedit.event.trigger("selection:change");
			if (updateui) ghostedit.event.trigger("ui:update");
			return true;
		};
		
		_selection.restore = function (type, data, mustbevalid) {
			if (!type || typeof type !== "string") type = _selection.saved.type;
			if (!data) data = _selection.saved.data;
			
			// if type is none, but cant be, get archived selection
			if (type === "none" && mustbevalid) {
				type = _selection.archived.type;
				data = _selection.archived.data;
			} 
			
			// If type is none, clear selection
			if (type === "none") {
				_selection.clear();
				return true;
			}
			
			// Else, call restore function from appropriate plugin
			if (ghostedit.plugins[type] && ghostedit.plugins[type].selection.restore) {
				if (ghostedit.plugins[type].selection.restore(data)) {
					return true;
				}
				else {
					_selection.clear();
					return false;
				}
			}
		};
		
		_selection.restoreValid = function (type, data) {
			return _selection.restore(type, data, true);
		};
		
		_selection.deleteContents = function (collapse) {
			if (collapse !== "collapsetostart" && collapse !== "collapsetoend") collapse = false;
			var handler, handled, ghostblock;
			
			ghostblock = _selection.getContainingGhostBlock();
			
			while (true) {
				handler = ghostblock.getAttribute("data-ghostedit-handler");
				handled = ghostedit.plugins[handler].selection.deleteContents(ghostblock, collapse);
				if (handled === true) break;
				
				ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
				if (!ghostblock) break;
			}
						
			switch (collapse) {
				case "collapsetostart":
					lasso().setToSelection().collapseToStart().select();
				break;
				case "collapsetoend":
					lasso().setToSelection().collapseToEnd().select();
				break;
			}
			
			_selection.save();
		};
		
		_selection.isSameAs = function (sel) {
			if (!sel || !sel.type) return false;
			
			if (sel.type !== _selection.saved.type) return false;
			
			if (sel.type === "none") return true;
			// Else, call compare function from appropriate plugin
			if (ghostedit.plugins[sel.type] && ghostedit.plugins[sel.type].selection.compare) {
				return ghostedit.plugins[sel.type].selection.compare (sel.data, _selection.saved.data);
			}
			return false;
		};
		
		_selection.clear = function () {
			lasso().clearSelection();
			_selection.saved = {"type": "none", "data": null};
		};
		
		_selection.isInEditdiv = function (elem) {
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") !== "true") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") !== "true") {
					if (elem === null) return false;
					elem = elem.parentNode;
					if (elem === null) return false;
				}
			}
			return true;
		};
		
		_selection.updatePathInfo = function (elem) {
			if (!elem) elem = _selection.saved.data;
			if (!elem.nodeType) elem = elem.getParentNode();
			
			// If nodepath is same as before, don't bother calculating it again
			// below code DOES NOT equal above statement. (dom node can have moved)
			//if (elem === _selection.nodepath[0]) return true;
			
			_selection.nodepath = [];
			
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") !== "true") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") !== "true") {
					
					if (elem === null) return null;
					
					if (elem.nodeType === 1) _selection.nodepath.push(elem);
					
					elem = elem.parentNode;
					
					if (elem === null) return false;
				}
			}
			
			// Make sure rootnode is also included in path
			if (elem && elem.getAttribute("data-ghostedit-isrootnode") === "true") {
				_selection.nodepath.push(elem);
			}
		};
		
		_selection.getContainingGhostBlock = function () {
			var node = _selection.saved.data;
			if (!node.nodeType) node = node.getParentNode();

			if (!node) return false;

			while (!ghostedit.dom.isGhostBlock(node)) {
				node = node.parentNode;
				if (node === null) return false;
			}
			
			return node;
		};
		
		window.ghostedit.selection = _selection;
})(window);
(function(window, undefined) {
	
	var _inout = {},
	ghostedit = window.ghostedit;
	
	_inout.init = function () {
		// Set initial variables
		_inout.reset();
		
		// Add listener to check whether the selection has changed since the last undo save
		ghostedit.event.addListener("selection:change", function () { ghostedit.history.selectionchanged = true; });
		
		// Export undo and redo function to the api
		ghostedit.api.importHTML = function (source) { return _inout.importHTML(source); };
		ghostedit.api.exportHTML = function () { return _inout.exportHTML(); };
	};
	
	_inout.reset = function () {
		_inout.importhandlers = [];
	};
	
	_inout.importHTML = function (sourcenode) {
		var /*tagname, handler, result*/ rootnode;
		if (!sourcenode || sourcenode.childNodes.length < 1) return false;
		
		/*var tagname = sourcenode.tagName.toLowerCase();
		if (handler = _inout.importhandlers[tagname]) {
			result = ghostedit.plugins[handler].inout.importHTML(insertedelem, elem)
			if (result) insertedelem = result;
		}*/
		
		// Call container import, and set resulting domnode's contenteditable to true
		rootnode = ghostedit.plugins.container.inout.importHTML(sourcenode);
		rootnode.className = "ghostedit_rootnode";
		rootnode.setAttribute("data-ghostedit-isrootnode", "true");
		rootnode.contentEditable = 'true';
		
		// Trigger 'import:after' event
		ghostedit.event.trigger("import:after", {"rootnode": rootnode});
		
		// Return rootnode container
		return rootnode;
	};
	
	_inout.exportHTML = function () {
		var finalexport,
		editwrap = ghostedit.el.rootnode;
		
		ghostedit.event.trigger("export:before");
		
		//Preparation - contenteditable = false
		editwrap.contentEditable = false;
		
		finalexport = ghostedit.plugins.container.inout.exportHTML(editwrap, false);
		
		//Tidy up - contenteditable = true
		editwrap.contentEditable = true;
		
		ghostedit.event.trigger("export:after");
		
		return finalexport; //{snippet: snippet, full: finalCode};
	};

	_inout.openPreview = function () {
		window.open(ghostedit.options.previewurl);
	};
	
	_inout.registerimporthandler = function (importhandler/*, tagnames of elements that can be handled*/) {
		var i, args, tag;
		if (typeof importhandler !== "function") return false;
		if (arguments.length < 2) return false;
		args = Array.prototype.slice.call(arguments);
		args.shift();
		
		// Loop through arguments
		for (i = 0; i < args.length; i++) {
			tag = args[i];
			
			_inout.importhandlers[tag] = importhandler;
		}
	};
	
	window.ghostedit.inout = _inout;
})(window);
(function(window, undefined) {
	
	var _history = {},
	ghostedit = window.ghostedit;
	
	_history.init = function () {
		// Set initial variables
		_history.reset();
		
		// Add listener to check whether the selection has changed since the last undo save
		ghostedit.event.addListener("selection:change", function () { _history.selectionchanged = true; });
		
		// Export undo and redo function to the api
		ghostedit.api.undo = function () { return _history.undo(); };
		ghostedit.api.redo = function () { return _history.redo(); };
	};
	
	_history.reset = function () {
		_history.undoData = [];//new Array(_history.undolevels);
		/*_history.undolevels = 4000,*/
		_history.undoPoint = 0;
		_history.selectionchanged = true;
	};
	
	_history.saveUndoState = function (force) {
		var undoPoint, undoData, contentchanged, selectionchanged, currentstate, undostate,
		editwrap = ghostedit.el.rootnode;
		
		if (force !== true) force = false;
		
		ghostedit.event.trigger("history:save:before");
		
		// Localise undo variables
		undoPoint = _history.undoPoint;
		undoData = _history.undoData;
		
		// Get latest undopoint into a variable
		undostate = undoData[undoPoint];
		if (!undostate) force = true;
		
		// Start capturing current editor state
		currentstate = {
			id: "",
			selection: {
				"type": ghostedit.selection.saved.type,
				//"data": ghostedit.selection.saved.type === "textblock" ? ghostedit.selection.saved.data.clone() : ghostedit.selection.saved.data
				"data": ghostedit.selection.saved.data
			},
			content: {
				"string": editwrap.innerHTML
			}
		};
		
		// Calcuate whether the selection or content have changed
		if (!force) {
			contentchanged = (undostate.content.string !== currentstate.content.string) ? true : false;
			selectionchanged = !(ghostedit.selection.isSameAs(undostate.selection));
		}
		
		if (force || selectionchanged || contentchanged) {
			
			// Clone editor content as documentFragment
			currentstate.content.dom = ghostedit.dom.extractContent(editwrap.cloneNode(true));
			
			if (force || contentchanged) {
				// Remove existing redo data
				if (undoPoint > 0) _history.undoData.splice(0, undoPoint);
				// Save new data and set undoPoint to point at it
				_history.undoData.unshift(currentstate);
				_history.undoPoint = 0;
			}
			else {
				_history.undoData[undoPoint] = currentstate;
			}
		}
		
		ghostedit.event.trigger("history:save:after");
	};
	
	_history.restoreUndoPoint = function (undopoint) {
		var undoData = _history.undoData,
		undostate = undoData[undopoint];
		if (!undostate || undostate.content.string.length < 1) return false;
		
		ghostedit.event.trigger("history:restore:before");
		
		ghostedit.el.rootnode.innerHTML = "";
		ghostedit.el.rootnode.appendChild(ghostedit.dom.cloneContent(undostate.content.dom));
		
		ghostedit.selection.restore (undostate.selection.type, undostate.selection.data);
		//ghostedit.selection.save();
		
		ghostedit.event.trigger("history:restore:after");
	};
	
	_history.undo = function () {
		var undoPoint = _history.undoPoint,
		undoData = _history.undoData,
		editwrap = ghostedit.el.rootnode;
		
		if (undoData[undoPoint+1] === undefined ||
			undoData[undoPoint+1].content.string.length <= 0) return;
		// if (undoPoint < _history.undolevels  - 1) return; //unlimited undo levels
		
		ghostedit.event.trigger("history:undo:before");
		// If there are unsaved changes, save current content and revert to last saved undopoint (was 0, but now 1 because current state saved in 0)
		if (undoData[undoPoint].content.string !== editwrap.innerHTML) {
			_history.saveUndoState();
			undoPoint = 1;
		}
		// Else, current state already saved, revert to previous saved one (undoPoint + 1)
		else {
			if (undoPoint === 0) {
				_history.saveUndoState();
			}
			undoPoint = _history.undoPoint;
			undoPoint += 1;
		}

		_history.restoreUndoPoint(undoPoint);
		_history.undoPoint = undoPoint;
		_history.undoData = undoData;

		ghostedit.event.trigger("history:undo:after");
	};
	
	_history.redo = function () {
		var undoPoint = _history.undoPoint,
		undoData = _history.undoData,
		editwrap = ghostedit.el.rootnode;
		
		if (undoPoint > 0 && undoData[undoPoint-1] !== undefined && undoData[undoPoint-1].content.string.length > 0) {
			
			ghostedit.event.trigger("history:redo:before");
			
			// The user has made changes since the last undo/redo, throw away redo data and save undo state
			if (undoData[undoPoint].content.string !== editwrap.innerHTML) {
				_history.saveUndoState(true);
			}
			// Last action was an undo/redo, move one point forwards if possible
			else {
				undoPoint-=1;
				_history.restoreUndoPoint(undoPoint);
				_history.undoPoint = undoPoint;
				_history.undoData = undoData;
			}
			
			ghostedit.event.trigger("history:redo:after");
		}
	};
	
	window.ghostedit.history = _history;
})(window);
(function (window, undefined) {
	
	var _clipboard = {}, _paste, _cut,
	lasso = window.lasso,
	ghostedit = window.ghostedit,
	console = window.console || {};
	console.log = console.log || function () {};
	
	_clipboard.init = function () {
		_clipboard.paste.init();
		_clipboard.cut.init();
	};
	
	_paste = {
		savedcontent: null,
		savedundodata: null,
		savedundopoint: null,
		beforerangedata: "",
		afterrangedata: "",
		waitlength: 0,
		postpastetidylist: []
	};
	
	_paste.init = function () {
		ghostedit.event.addListener("init:after", function () {
			ghostedit.util.addEvent(ghostedit.el.rootnode, "paste", function(event) { _paste.handle(event); });
		}, "clipboard");
	};
	
	_paste.handle = function (e) {//elem no longer used?
		
		// Save editor state, and save undo data in case paste functions mess up undo stack
		ghostedit.history.saveUndoState();
		_paste.savedundodata = ghostedit.history.undoData;
		_paste.savedundopoint = ghostedit.history.undoPoint;

		_paste.triedpasteimage = false;
		// If webkit - get data from clipboard, put into rootnode, cleanup, then cancel event
		if (e.clipboardData && e.clipboardData.getData) {
			if (/image/.test(e.clipboardData.types)) {
				_paste.triedpasteimage = true;
			}
			
			if (/text\/html/.test(e.clipboardData.types)) {
				ghostedit.el.rootnode.innerHTML = e.clipboardData.getData('text/html');
			}
			else if (/text\/plain/.test(e.clipboardData.types) || ghostedit.browserEngine.opera) {
				ghostedit.el.rootnode.innerHTML = e.clipboardData.getData('text/plain').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
			}
			else {
				ghostedit.el.rootnode.innerHTML = "";
			}
			_paste.waitfordata();
			return ghostedit.util.cancelEvent(e);
		}
		//Else - empty rootnode and allow browser to paste content into it, then cleanup
		else {
			ghostedit.el.rootnode.innerHTML = "";
			_paste.waitfordata();
			return true;
		}
	};
	
	_paste.waitfordata = function () {
		var elem = ghostedit.el.rootnode;
		if (elem.childNodes && elem.childNodes.length > 0) {
			_paste.process();
		}
		else {
			setTimeout(_paste.waitfordata, 20);
		}
	};
	
	_paste.process = function () {
		var pastenode, collapsed, hasmerged, handler, target, result, source, position;
		
		// Extract pasted content into a new element
		pastenode = document.createElement("div");
		pastenode = ghostedit.plugins.container.inout.importHTML(ghostedit.el.rootnode);
		console.log ("processed content");
		console.log (pastenode.cloneNode(true));
		
		// Restore undo data, and restore editor content
		ghostedit.history.undoData = _paste.savedundodata;
		ghostedit.history.undoPoint = _paste.savedundopoint;
		ghostedit.history.restoreUndoPoint(ghostedit.history.undoPoint);
		ghostedit.selection.save();
		
		// Delete selection contents if selection is non-collapsed
		ghostedit.selection.deleteContents();
		ghostedit.selection.save();
		
		// If no content was pasted, return
		source = ghostedit.dom.getFirstChildGhostBlock(pastenode);
		if (!source) return;
		
		// Save selection to DOM
		if(ghostedit.selection.saved.data.isCollapsed()){
			ghostedit.selection.saved.data.saveToDOM("ghostedit_paste_start");
		}
		else {
			ghostedit.selection.saved.data.clone().collapseToStart().saveToDOM("ghostedit_paste_start");
			ghostedit.selection.saved.data.clone().collapseToEnd().saveToDOM("ghostedit_paste_end");
		}
		
		
		// Call handler on first pasted node
		target = function () { return ghostedit.selection.saved.data.getStartNode(); };
		position = {"isfirst": true, "islast": (ghostedit.dom.getLastChildGhostBlock(pastenode) === source) ? true : false};
		target = _paste.callHandler (target, source, position);
		
		
		/*ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
		if (lasso().isSavedRange("ghostedit_paste_end")) {
			ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
		}
		ghostedit.selection.saved.data.select().inspect();
		return;/* */
		
		
		// Call handler on last pasted node
		source = ghostedit.dom.getLastChildGhostBlock(pastenode);
		if (source) {
			target = function () { return ghostedit.selection.saved.data.getEndNode(); };
			position = {"isfirst": false, "islast": true};
			_paste.callHandler (target, source, position);
		}
		
		
		/*ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
		if (lasso().isSavedRange("ghostedit_paste_end")) {
			ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
		}
		ghostedit.selection.saved.data.select().inspect();
		return;/* */
		
		// Loop through and call handler on remaining nodes
		target = function () { return ghostedit.selection.saved.data.getParentNode(); };
		position = {"isfirst": false, "islast": false};
		while ((source = ghostedit.dom.getFirstChildGhostBlock(pastenode))) {			
			_paste.callHandler (target, source, position);
		}
		
		
		// Restore the selection (collapsed to the end)
		ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", true).select();
		if (ghostedit.selection.saved.data.isSavedRange("ghostedit_paste_end")) {
			ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_end", true).select();
		}
		ghostedit.selection.save();
		
		// Save undo state
		ghostedit.history.undoData = _paste.savedundodata;
		ghostedit.history.undoPoint = _paste.savedundopoint;
		ghostedit.history.saveUndoState();
		
		if (_paste.triedpasteimage) {
			ghostedit.event.trigger("ui:message", {message: "You cannot paste images into the editor, please use the add image button instead", time: 2, color: "warn"});
		}
		
		ghostedit.event.trigger("clipboard:paste:after");
	};
	
	_paste.callHandler = function (targetF, source, position) {
		var target, handler, result;
		
		// Restore the selection from DOM markers
		ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
		if (lasso().isSavedRange("ghostedit_paste_end")) {
			ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
		}
		
		// Get the target
		target = targetF();
		if (!ghostedit.dom.isGhostBlock(target)) target = ghostedit.dom.getParentGhostBlock(target);
		
		// Recursively call handler of target and it's parents
		while (true) {
			if (!target) break;
			
			// Get handler plugin for specified target
			handler = target.getAttribute("data-ghostedit-handler");
			if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].paste) break;
			
			console.log("Call handler: (" + (position.isfirst?"first":position.islast?"last":"normal") + ")" + handler);
			console.log(target.cloneNode(true));
			console.log(source.cloneNode(true));
			
			// Call handler function for target
			result = ghostedit.plugins[handler].paste.handle (target, source, position);
			console.log("result: " + result);
			
			// If handler function returns true, then source is handled: remove it and return false to indicate not to continue
			if (result) {
				source.parentNode.removeChild(source);
				break;
			}
			
			// Else, restore the selection from DOM markers
			ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
			if (lasso().isSavedRange("ghostedit_paste_end")) {
				ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
			}
			
			// Get the the parent GhostBlock as the next target to try
			target = ghostedit.dom.getParentGhostBlock(target);
		}
	};
	
	_cut = {
		savedcontent: null,
		savedundodata: null,
		savedundopoint: null
	};
	
	_cut.init = function () {
		ghostedit.event.addListener("init:after", function () {
			ghostedit.util.addEvent(ghostedit.el.rootnode, "cut", function(event) { _cut.handle(event); });
		}, "clipboard");
	};
	
	_cut.handle = function () {
		
		// Save editor state, and save undo data in case paste functions mess up undo stack
		ghostedit.history.saveUndoState();
		_cut.savedundodata = ghostedit.history.undoData;
		_cut.savedundopoint = ghostedit.history.undoPoint;

		//Else - empty rootnode and allow browser to paste content into it, then cleanup
		setTimeout(_cut.cleanup, 20);
		return true;
	};
	
	_cut.cleanup = function () {

		// Restore undo data, and restore editor content
		ghostedit.history.undoData = _cut.savedundodata;
		ghostedit.history.undoPoint = _cut.savedundopoint;
		ghostedit.history.restoreUndoPoint(ghostedit.history.undoPoint);
		ghostedit.selection.save();
		
		// Delete selection contents if selection is non-collapsed
		ghostedit.selection.deleteContents();
		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_clipboard.paste = _paste;
	_clipboard.cut = _cut;
	window.ghostedit.clipboard = _clipboard;
})(window);
(function (window, undefined) {
	
	var _textblock = {},
	lasso = window.lasso,
	ghostedit = window.ghostedit,
	console = window.console || {};
	console.log = console.log || function () {};
	
	_textblock.enable = function () {
				
		_textblock.format.init();
			
		ghostedit.inout.registerimporthandler (_textblock.inout.importHTML, "p", "h1", "h2", "h3", "h4", "h5", "h6");
		ghostedit.inout.registerimporthandler (_textblock.inout.importHTML, "#textnode", "b", "strong", "i", "em", "u", "strike", "span");
		
		// Bookmarkify (serialize) the selection, and save the bookmark to the lasso object
		ghostedit.event.addListener("history:save:after", function () {
			if (ghostedit.selection.saved.type === "textblock") {
				ghostedit.selection.saved.data.bookmarkify(ghostedit.el.rootnode);
			}
		});
		
		// Clone range object after undo save to avoid accidentally modifying the saved range objects
		ghostedit.event.addListener("history:save:after", function () {
			if (ghostedit.selection.saved.type === "textblock") {
				ghostedit.selection.saved.data = ghostedit.selection.saved.data.clone();
			}
		});
		
		ghostedit.api.insert = ghostedit.api.insert || {};
		ghostedit.api.insert.character = function (character) { return _textblock.insert.character(character); };
		ghostedit.api.insert.br = function () {return _textblock.insert.br; };
		
		return true;
	};
		
	_textblock.event = {
		keydown: function (target, keycode, event) {
			switch (keycode) {
				case 8: // backspace
					return _textblock.event.backspace(target, event);
				case 46: //delete
					return _textblock.event.deletekey (target, event);
			}
		},
		
		keypress: function (target, keycode, event) {
			// Enter key
			if (keycode === 13) return _textblock.event.enterkey (target, event);
		},
		
		backspace: function (block, e) {
			if (_textblock.selection.isAtStartOfTextBlock() !== true) {
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
							ghostedit.plugins[handler].dom.removechild(parent, node);}, false, block)
					}
				};
				ghostedit.event.sendBackwards("delete", block, params );

				ghostedit.event.cancelKeypress = true;
				ghostedit.util.cancelEvent ( e );
				return true;
			}
		},
		
		deletekey: function (block, e) {
			//var block = ghostedit.selection.getContainingGhostBlock();
			if (_textblock.selection.isAtEndOfTextBlock() !== true) {
				//Caret not at end of textblock: return true to indicate handled
				return true;
			}
			else {
				ghostedit.event.sendForwards("delete", block);
				//_textblock.remove(_textblock.selection.getStartTextBlockNode());
				ghostedit.event.cancelKeypress = true;
				ghostedit.util.cancelEvent ( e );
				return true;
			}
		},
		
		enterkey: function (elem, e) {
			ghostedit.history.saveUndoState();
			
			if (e.shiftKey) {
				_textblock.insert.br();
				_textblock.mozBrs.tidy (elem);
			}
			else {
				_textblock.split(elem);
			}
			ghostedit.history.saveUndoState();
			
			ghostedit.util.cancelEvent ( e );
			return true;
		}
	};
	
	_textblock.dom = {
		deleteevent: function (target, sourcedirection, params){
			var parent, handler, block;
			switch (sourcedirection) {
				case "ahead":
					ghostedit.history.saveUndoState();
					if (!_textblock.isEmpty(target)) {
						target.innerHTML += "<span id='ghostedit_selection_marker'>&#x200b;</span>";
						if (params.merge && params.merge.sourcecontent && (params.merge.contenttype === "inlinehtml" || params.merge.contenttype === "text")) {
							target.innerHTML += params.merge.sourcecontent;
						}
						_textblock.mozBrs.tidy(target);
						params.merge.callback();
						//params.sourceblock.parentNode.removeChild(params.sourceblock);
						lasso().selectNode("ghostedit_selection_marker").select();//.deleteContents();
						document.getElementById("ghostedit_selection_marker").parentNode.removeChild(document.getElementById("ghostedit_selection_marker"));
						ghostedit.selection.save();
					}
					else {
						parent = ghostedit.dom.getParentGhostBlock(target);
						handler = parent.getAttribute("data-ghostedit-handler");
						//alert(target.id);
						ghostedit.plugins[handler].dom.removechild(parent, target);
					}
					ghostedit.history.saveUndoState();
					return true;
				case "behind":
					block = ghostedit.selection.getContainingGhostBlock();
					params =  {
						"merge": {
							"contenttype": "inlinehtml",
							"sourcecontent": target.innerHTML,
							"callback": ghostedit.util.preparefunction(function (node) {
										var parent = node.parentNode,
										handler = parent.getAttribute("data-ghostedit-handler");
										ghostedit.plugins[handler].dom.removechild(parent, node);
									}, false, target)
						}
					};
					ghostedit.event.sendBackwards("delete", target, params);
					//----------------------------------
					//_textblock.remove(_textblock.selection.getStartTextBlockNode());
					
					//ghostedit.event.cancelKeypress = true;
					//return ghostedit.util.cancelEvent ( e );
					return true;
			}
		}
	};
	
	_textblock.selection = {
		compare: function (r1, r2) {
			if (!r1 || !r1.isEqualTo) return false;
			return r1.isEqualTo(r2);
		},
		
		restore: function (savedrange) {
			if (!savedrange || !savedrange.unbookmarkify) return false;
			savedrange.unbookmarkify(ghostedit.el.rootnode);
			savedrange.select();
			return true;
		},
		
		deleteContents: function (textblockelem) {
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
		
		getTextBlockNode: function (elem) {
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-elemtype") !== "textblock") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-elemtype") !== "textblock") {
					elem = elem.parentNode;
					if (elem === null) return false;
				}
			}
			return elem;
		},
		
		getStartTextBlockNode: function () {
			return _textblock.selection.getTextBlockNode( ghostedit.selection.savedRange.getStartNode() );
		},
		
		getEndTextBlockNode: function () {
			return _textblock.selection.getTextBlockNode( ghostedit.selection.savedRange.getEndNode() );
		},
		
		
		//Assumes selection saved manually
		isAtStartOfTextBlock: function (point) {
			var caretIsAtStart = false, range, selrange, i, isequal, firstnode, textblocknode, wholenode, tempnode,
			useselection;
			
			// Check if 'point' parameter was passed and is a lasso object, otherwise get selection
			useselection = false;
			if (!point || !point.isLassoObject) {
				if (ghostedit.selection.saved.type !== "textblock") return false;
				point = ghostedit.selection.saved.data;
				useselection = true;
			}
			
			if(document.createRange) {
				range = point;
				if(range.isCollapsed() && range.getNative().startOffset === 0) {
					caretIsAtStart = true;
					tempnode = ghostedit.selection.savedRange.getStartNode();
				}
				
				if (!tempnode) return caretIsAtStart;
			
				// If tempnode not right at start
				while (tempnode.nodeType !== 1 || tempnode.getAttribute("data-ghostedit-elemtype") !== "textblock") {
					if (tempnode !== tempnode.parentNode.childNodes[0]) {
						isequal = false;
						if((tempnode.parentNode.childNodes[0].nodeType === 3 && tempnode.parentNode.childNodes[0].length === 0) ||
								(tempnode.parentNode.childNodes[0].nodeType === 1 && tempnode.parentNode.childNodes[0].className === "moz_dirty")) {
							//Deals with empty text nodes at start of textblock elem
							for(i = 1; i < tempnode.parentNode.childNodes.length; i += 1) {
								firstnode = tempnode.parentNode.childNodes[0];
								if (tempnode === tempnode.parentNode.childNodes[i]) {
									isequal = true;
									break;
								}
								else if(!(firstnode.nodeType === 3 && firstnode.length === 0) &&
									!(firstnode.nodeType === 1 && firstnode.className === "moz_dirty")) {
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
				selrange = point.clone().bookmarkify();
				
				textblocknode = _textblock.selection.getStartTextBlockNode();
				
				// Get range representing the whole TextBlock contents
				wholenode = lasso().selectNodeContents( textblocknode );
				
				// Unbookmarkify the range, so it can be used in comparisons again
				selrange.unbookmarkify();
				
				// Compare html of wholenode with html of node starting from selected point, if eqaul then selection is at the start of the textblock
				if (wholenode.getHTML() === wholenode.setStartToRangeStart(selrange).getHTML()) {
						caretIsAtStart = true;
				}
				
				if (useselection) {
					ghostedit.selection.savedRange = selrange.select();
				}
			}
			return caretIsAtStart;
		},

		
		//Assumes selection saved manually
		isAtEndOfTextBlock: function () {
			var caretIsAtEnd = false, selrange, range, rangefrag, elemfrag, textblocknode, endpoint;
			
			if (!ghostedit.selection.savedRange.isCollapsed()) return false;
			
			textblocknode = _textblock.selection.getEndTextBlockNode();
			if(document.createRange) {
				
				rangefrag = document.createElement("div");
				rangefrag.appendChild( ghostedit.selection.savedRange.getNative().cloneContents() );
				
				range = ghostedit.selection.savedRange.getNative();
				range.setEnd(textblocknode, textblocknode.childNodes.length);
				elemfrag = document.createElement("div");
				rangefrag.appendChild( range.cloneContents() );
				
				_textblock.mozBrs.clear(rangefrag);
				_textblock.mozBrs.clear(elemfrag);
				
				if(rangefrag.innerHTML === elemfrag.innerHTML) {
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
				wordstart = _textblock.selection.findwordstart (range.startContainer, range.startOffset);
				wordend = _textblock.selection.findwordend (range.endContainer, range.endOffset);
				
				//If only one end has moved (or neither), then it's not from the middle
				if (onlyfrommiddle) {
					if (range.startContainer === wordstart.node && range.startOffset === wordstart.offset) return lasso().setFromNative(range);
					if (range.endContainer === wordend.node && range.endOffset === wordend.offset) return lasso().setFromNative(range);
				}
				
				range.setStart(wordstart.node, wordstart.offset);
				range.setEnd(wordend.node, wordend.offset);
			}
			else {
				range.expand("word");
				if (range.htmlText.split().reverse()[0] === " ") {
					range.moveEnd("character", -1);
				}
			}
			return lasso().setFromNative(range);
		},
		
		findwordstart: function (node, offset) {
			var leftnodecontent, stroffset, totalstroffset, prevnode, wordendregex = /\s|[\!\?\.\,\:\;\"]/;
			
			if (!node || !node.nodeType) return false;
			
			// Handle text node
			if (node.nodeType === 3) {
				leftnodecontent = node.nodeValue.substring(0, offset);
				stroffset = leftnodecontent.search(wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if(stroffset !== -1) {
					totalstroffset = stroffset + 1;
					while ((stroffset = leftnodecontent.substring(totalstroffset).search(wordendregex)) !== -1) {
						totalstroffset += stroffset + 1;
					}
					return { node: node, offset: totalstroffset };
				}
			}
			
			// Handle Element
			else if (node.nodeType === 1) {
				if (offset > 0) {
					return _textblock.selection.findwordstart(node.childNodes[offset - 1], node.childNodes[offset - 1].length);
				}
			}
			
			// If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (_textblock.isTextBlock(node)){
				return {"node": node, "offset": offset};
			}
			
			// If node is a NOT ghostedit_textblock: check previous node
			prevnode = node.previousSibling;
			if (prevnode) {
				if (prevnode.nodeType === 3) {
					return _textblock.selection.findwordstart(prevnode, prevnode.nodeValue.length);
				}
				else if (prevnode.nodeType === 1) {
					return _textblock.selection.findwordstart(prevnode, prevnode.childNodes.length);
				}
			}
			// If node is a NOT ghostedit_textblock and no previousSibling: move up tree
			else {
				return _textblock.selection.findwordstart(node.parentNode, ghostedit.dom.getNodeOffset(node));
			}
			
			
		},
		
		findwordend: function (node, offset) {
			var rightnodecontent, stroffset, totalstroffset, nextnode,
			wordendregex = /\s|[\!\?\.\,\:\;\"]/;
			
			if (!node || !node.nodeType) return false;
			
			// Handle text node
			if (node.nodeType === 3) {
				rightnodecontent = node.nodeValue.substring(offset);
				stroffset = rightnodecontent.search(wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if (stroffset !== -1) {
					totalstroffset = offset + stroffset;
					return { node: node, offset: totalstroffset };
				}
			}
			
			// Handle Element
			else if (node.nodeType === 1) {
				if (offset < node.childNodes.length) {
					return _textblock.selection.findwordend(node.childNodes[offset], 0);
				}
			}
			
			// If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (_textblock.isTextBlock(node)){
				return {"node": node, "offset": offset};
			}
			
			// If node is a NOT ghostedit_textblock: check next node
			nextnode = node.nextSibling;
			if (nextnode) {
				return _textblock.selection.findwordend(nextnode, 0);
			}
			// If node is a NOT ghostedit_textblock and no nextSibling: move up tree
			else {
				return _textblock.selection.findwordend(node.parentNode, ghostedit.dom.getNodeOffset(node) + 1);
			}
		}
	};
	
	_textblock.inout = {
		handledtags: {
			"h1": "block", "h2": "block", "h3": "block", "h4": "block", "h5": "block", "h6": "block", "p": "block",
			"b": "child", "i": "child", "u": "child", "strong": "child", "em": "child", "strike": "child", "br": "child",
			"a": "contents", "span": "contents"
		},
		
		parserules: {
			"textnode": { "clean": true },
			"tags": {
				"h1": "textblock", "h2": "textblock", "h3": "textblock", "h4": "textblock", "h5": "textblock", "h6": "textblock", "p": "textblock",
				"b": {}, "i": {}, "u": {}, "strong": {}, "em": {}, "strike": {},
				"br": { "attributes": [ {"name": "class", "allowedvalues": [ "moz_dirty" ]} ] }
			},
			"templates": {
				"textblock": {
					"attributes": [ "class" ],
					"styles": [ 
						{"name": "textAlign", "allowedvalues": ["left", "right", "center", "justified"] },
						{"name": "clear", "allowedvalues": ["left", "right"] }
					]
				}
			}
		},
		
		importHTML: function (source) {
			var newTextBlock, tagname, node, childcount, prevnode, nodetype, parsednode;
			
			nodetype = _textblock.inout.isHandleableNode(source);
			switch (nodetype) {
				case "block":
					// Create TextBlock
					tagname = source.tagName.toLowerCase();
					newTextBlock = ghostedit.dom.parse(source, _textblock.inout.parserules);
					
					ghostedit.blockElemId += 1;
					newTextBlock.id = 'ghostedit_textblock_' + ghostedit.blockElemId;
					
					// Set GhostEdit handler attributes
					newTextBlock.setAttribute("data-ghostedit-iselem", "true");
					newTextBlock.setAttribute("data-ghostedit-elemtype", "textblock");
					newTextBlock.setAttribute("data-ghostedit-handler", "textblock");
					
					// Add event handlers
					newTextBlock.ondragenter = function(){return false;};
					newTextBlock.ondragleave = function(){return false;};
					newTextBlock.ondragover = function(){return false;};
					newTextBlock.ondrop = function(e){
						var elem, elemid;
						// This function does basic image paragraph changing dnd
						elemid = e.dataTransfer.getData("Text") || e.srcElement.id;
						//alert(elemid); TODO drag drop
						elem = document.getElementById(elemid);
						elem.parentNode.insertBefore(elem,this);
						ghostedit.image.focus(elem);
						};
					newTextBlock.onresizestart = function(e) {return ghostedit.util.cancelEvent(e);};
								
					_textblock.mozBrs.tidy (newTextBlock);
					return newTextBlock;
				case "child":
				case "contents":
				case "text":
					newTextBlock = _textblock.create("p");
					newTextBlock.setAttribute("data-ghostedit-importinfo", "wasinline");
					childcount = 0;
					node = source;
					do {
						parsednode = ghostedit.dom.parse(node, _textblock.inout.parserules);
						if (parsednode) {
							childcount += 1;
							newTextBlock.appendChild(parsednode);
							prevnode = node;
							node = node.nextSibling;
							if (childcount > 1) prevnode.parentNode.removeChild(prevnode);
						}
					}
					while (_textblock.inout.isHandleableNode(node) && _textblock.inout.isHandleableNode(node) !== "block");
					
					_textblock.mozBrs.tidy (newTextBlock);
					return (childcount > 0) ? newTextBlock : false;
			}
			return false;
		},
		
		exportHTML: function (target) {
			if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;	
			var finalCode = "", stylecode = "", elem;
			elem = target;
			
			_textblock.mozBrs.clear(elem);
	
			//if(elem.tagName.toLowerCase() == "p") paracount++;
			
			
			finalCode += "<" + elem.tagName.toLowerCase();
			
			// Extract styles
			if (elem.style.textAlign !== "") { stylecode += "text-align:" + elem.style.textAlign + ";"; }
			if (elem.style.clear !== "") stylecode += "clear:" + elem.style.clear + ";";
			
			if (stylecode.length > 0) finalCode += " style='" + stylecode + "'";
			
			// Extract class
			if (elem.className.length > 0 && !/ghostedit/.test(elem.className)) finalCode += " class='" + elem.className + "'";
			
			finalCode += ">";
			
			// Copy content and end tag
			finalCode += elem.innerHTML;
			finalCode += "</" + elem.tagName.toLowerCase() + ">";
			
			_textblock.mozBrs.tidy(elem);
			
			return {content: finalCode};
		},
		
		isHandleableNode: function (node) {
			var nodetag;
			if (!node || !node.nodeType) return false;
			
			// Handle textnode case
			if (node.nodeType === 3) return (node.nodeValue.replace(/[\n\r\t]/g,"").length > 0) ? "text" : false;
			
			// Handle not-element case (textnodes already handled)
			if (node.nodeType !== 1) return false;
			
			// Handle textblock case
			if(node.getAttribute("data-ghostedit-elemtype") === "textblock") return "block";
			
			// Handle other GhostBlock case (don't process other plugins' stuff)
			if (ghostedit.dom.isGhostBlock(node)) return false;
			
			// Else get tagname, and check handleable tag list
			nodetag = node.tagName.toLowerCase();				
			if (_textblock.inout.handledtags[nodetag]) {
				return _textblock.inout.handledtags[nodetag];
			}
			
			// Else return false
			return false;
		}
	};
	
	_textblock.paste = {			
		handle: function (target, source, position) {
			if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isGhostBlock(source)) return;
			
			console.log(position);
			
			// If source is first pasted element, and was inline content, or is of same type as target, then merge contents into target node
			if (position.isfirst) {
				return _textblock.paste.handleFirst(target, source, position);
			}
			
			if (position.islast) {
				return _textblock.paste.handleLast(target, source, position);
			}
			
			_textblock.paste.split(target);
			return false;
						
			/*if (!position.islast || !(source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) && _textblock.isEmpty(blocks.block2)) {
				parent = ghostedit.dom.getParentGhostBlock(blocks.block2);
				handler = parent.getAttribute("data-ghostedit-handler");
				
				marker = document.createElement("span");
				marker.id = "ghostedit_paste_end_range_start";
				marker.innerHTML = "&#x200b;";
				
				lasso().removeDOMmarkers("ghostedit_paste_end");
				ghostedit.plugins[handler].dom.addchild(parent, "after", blocks.block2, marker);
				ghostedit.plugins[handler].dom.removechild(parent, blocks.block2);
				return false;
			}*/
			
			/*PART OF SPLIT FUNCTION
			lasso().removeDOMmarkers("ghostedit_paste_end");
			blocks.block2.innerHTML = "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>" + blocks.block2.innerHTML;
			_textblock.mozBrs.tidy(blocks.block2);*/
			
			// If source is last pasted element, and was inline content, or is of same type as target, then prepend contents to second node
			/*if (position.islast && (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName)) {
				//DEV console.log("paste (last):");
				//DEV console.log(blocks.block2);
				blocks.block2.innerHTML = source.innerHTML + blocks.block2.innerHTML;
				blocks.block2 = _textblock.format.setTagType({"textblock": blocks.block2, "tagname": source.tagName.toLowerCase()});
				return true;
			}*/
			
			
			
			//DEV console.log(blocks.block1.parentNode.cloneNode(true));
		},
		
		handleFirst: function (target, source, position) {
			// No longer needed because is subset of 'p' check: source.getAttribute("data-ghostedit-importinfo") === "wasinline"
			if (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) {
				console.log("paste (first):");
				
				_textblock.mozBrs.clear(source);
				
				lasso().removeDOMmarkers("ghostedit_paste_start");
				source.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t1'>&#x200b;</span>";
				
				if (document.createRange) {
					ghostedit.selection.saved.data.collapseToStart().getNative().insertNode( ghostedit.dom.extractContent(source) );
				}
				else {
					ghostedit.selection.saved.data.collapseToStart().getNative().pasteHTML(source.innerHTML);
				}
				
				return true;
			}
			else {
				return false;
			}
		},
		
		handleLast: function (target, source, position) {
			if (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) {
				console.log("paste (last):");
				
				// If selection is collapsed, then create a new paragraph before merging contents
				if (ghostedit.selection.saved.data.isCollapsed()) {
					_textblock.paste.split(target);
					ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
					if (lasso().isSavedRange("ghostedit_paste_end")) {
						ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
					}
				}
				
				_textblock.mozBrs.clear(source);
				lasso().removeDOMmarkers("ghostedit_paste_end");
				source.innerHTML += "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>";
				
				if (document.createRange) {
					ghostedit.selection.saved.data.collapseToEnd().getNative().insertNode( ghostedit.dom.extractContent(source) );
				}
				else {
					ghostedit.selection.saved.data.collapseToEnd().getNative().pasteHTML(source.innerHTML);
				}
				
				return true;
			}
			else {
				return false;
			}
		},
		
		split: function (target, range) {
			var blocks, handlestartmarker = false;
			
			range = range || ghostedit.selection.saved.data;
			range = range.clone().collapseToStart();
			
			// Check whether target contains a start marker
			if (ghostedit.dom.isDescendant(target, document.getElementById("ghostedit_paste_start_range_start"))) {
				handlestartmarker = true;
			}
			
			if (handlestartmarker) {
				lasso().removeDOMmarkers("ghostedit_paste_start");//Must be before split or marker is duplicated
			}
			
			blocks = _textblock.split(target, range);
			
			if (handlestartmarker) {
				blocks.block1.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t2'>&#x200b;</span>";
				_textblock.mozBrs.tidy(blocks.block1);
			}
			
			// Tidy up end marker
			lasso().removeDOMmarkers("ghostedit_paste_end");
			blocks.block2.innerHTML = "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>" + blocks.block2.innerHTML;
			_textblock.mozBrs.tidy(blocks.block2);
			
			return blocks;
		}
	};
	
	_textblock.isTextBlock = function (textblock) {
		if (!ghostedit.dom.isGhostBlock(textblock)) return false;
		if (textblock.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;
		return true;
	};
	
	_textblock.isEmpty = function (textblock) {
		var textcontent, imgs, brs, i;
		
		// If the node contains textual content then it's not empty
		//if (ghostedit.util.strip_tags(textblockelem.innerHTML).length > 1) return false;
		
		textcontent = textblock.innerText || textblock.textContent;
		if (textcontent && textcontent.length > 1) return false;
		
		// If the node contains no textual content and no <br> or <img> tags then it is empty
		brs = textblock.getElementsByTagName("br");
		imgs = textblock.getElementsByTagName("img");
		if (brs.length === 0 && imgs.length === 0) return true;
		
		// Otherwise check for non MozDirty <br>'s
		for(i = 0; i < brs.length; i += 1) {
			if(brs[i].MozDirty === undefined && !/moz_dirty/.test(brs[i].className)) return false;
		}
		
		// If none are found then it's empty
		return true;
	};
	
	_textblock.isFirst = function (textblockelem) {
		var rootnode, i;
		rootnode = ghostedit.el.rootnode;
		for(i = 0; i < rootnode.getElementsByTagName("*").length; i += 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				if(rootnode.getElementsByTagName("*")[i] === textblockelem) {
					return true;
				}
				else {
					return false;
				}
			}
		}
	};
	
	_textblock.isLast = function (textblockelem) {
		var rootnode, i;
		rootnode = ghostedit.el.rootnode;
		for(i = rootnode.getElementsByTagName("*").length - 1; i > 0; i -= 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				if(rootnode.getElementsByTagName("*")[i] === textblockelem) {
					return true;
				}
				else {
					return false;
				}
			}
		}
	};
	
	_textblock.count = function () {
		var rootnode, childCount, i;
		rootnode = ghostedit.el.rootnode;
		childCount = 0;
		for(i = 0; i < rootnode.getElementsByTagName("*").length; i += 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				childCount += 1;
			}
		}
		return childCount;
	};
	
	_textblock.create = function (elemtype, content, id) {
		var newElem;
		
		// If explicit id not passed, get next blockElemId
		if (!id) {
			ghostedit.blockElemId += 1;
			id = 'ghostedit_textblock_' + ghostedit.blockElemId;
		}
		
		// If no content sent, set to default content of ""      ---"Edit Here!"
		content = (content && ((content.length && content.length > 0) || content.nodeType)) ? content : "";//"Edit Here!";
		
		// Create element, and assign id and content
		newElem = document.createElement(elemtype);
		newElem.id = id;
		if (content.nodeType) {
			content = ghostedit.dom.parse(content, {"textnode": { "clean": true }, "tags": { "b": {}, "i": {}, "u": {}, "strong": {}, "em": {}, "strike": {}, "br": {} } });
			if (content) newElem.appendChild(content);
		}
		else {
			newElem.innerHTML = content;
		}
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "textblock");
		newElem.setAttribute("data-ghostedit-handler", "textblock");
		
		// Add event handlers
		newElem.ondragenter = function(){return false;};
		newElem.ondragleave = function(){return false;};
		newElem.ondragover = function(){return false;};
		newElem.ondrop = function(e){
			var elem, elemid;
			// This function does basic image paragraph changing dnd
			elemid = e.dataTransfer.getData("Text") || e.srcElement.id;
			//alert(elemid); TODO drag drop
			elem = document.getElementById(elemid);
			elem.parentNode.insertBefore(elem,this);
			ghostedit.image.focus(elem);
			};
		newElem.onresizestart = function(e) {return ghostedit.util.cancelEvent(e);};
		
		// Tidy MozBr's in new element
		_textblock.mozBrs.tidy(newElem);
		
		return newElem;
	};
	
	_textblock.remove = function (textblockelem) {
		var savedElemContent, rootnode, focuselem, i, thisone, textblockelems;

		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
		
		// If textblock elem still contains content, save to variable for appending to previous textblock elem
		savedElemContent = "";
		savedElemContent = textblockelem.innerHTML;
		
		// Cycle through textblock elements backwards to select the one before the current one to focus
		rootnode = ghostedit.el.rootnode;
		textblockelems = rootnode.getElementsByTagName("*");
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
		if (_textblock.isEmpty(focuselem)) {
			rootnode.removeChild(focuselem);
			
			lasso().setCaretToStart(textblockelem).select();
			
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			return;
		}
		
		
		// Remove textblock elem
		rootnode.removeChild(textblockelem);
		
		// Set caret to end of focuselem
		lasso().setCaretToEnd(focuselem).select();
		ghostedit.selection.save();
		
		// Add saved content
		focuselem.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + savedElemContent;
		
		// Sort out MozBr's (one at very end of elements, that's it)
		_textblock.mozBrs.tidy(focuselem);
		
		// Place caret in correct place
		lasso().selectNode('ghostedit_marker').deleteContents().select();
		if (document.getElementById('ghostedit_marker')) {
			document.getElementById('ghostedit_marker').parentNode.removeChild(document.getElementById('ghostedit_marker'));
		}
		

		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_textblock.focus = function (target) {
		if (!target || target.nodeType !== 1 || target.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;
		
		lasso().setCaretToEnd(target).select();
		ghostedit.selection.save();
		return true;
	};
	
	_textblock.merge = function (block1, block2, collapse) {
		var block1type, block2type, parent, handler;
		
		// If collapse === false don't merge
		if (collapse === false) return block1;
		
		// If blocks are same node, return that node
		if (block1 === block2) return block1;
		
		block1type = block1.getAttribute("data-ghostedit-elemtype");
		block2type = block2.getAttribute("data-ghostedit-elemtype");
		
		// If one of the blocks isn't a textblock, return false
		if (block1type !== "textblock" || block2type !== "textblock") return false;
		
		// Otherwise, append block2content to block1 and delete block2
		block1.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + block2.innerHTML;
		parent = block2.parentNode;
		handler = parent.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].dom.removechild(parent, block2);
		_textblock.mozBrs.tidy(block1);
		lasso().selectNode("ghostedit_marker").select();//.deleteContents();
		document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
		return block1;
	};
	
	_textblock.split = function (elem, splitpoint) {
		var wheretoinsert, atstart, atend, elemtype, savedElemContent, range, result, newTextBlock, parent, handler, useselection;
		
		useselection = false;
		if (!splitpoint || !splitpoint.isLassoObject) {
			ghostedit.selection.save();
			if (ghostedit.selection.saved.type !== "textblock") return false;
			splitpoint = ghostedit.selection.saved.data;
			useselection = true;
		}
		splitpoint = splitpoint.clone().collapseToStart();
		
		atstart = (_textblock.selection.isAtStartOfTextBlock() === true) ? true : false;
		atend = (_textblock.selection.isAtEndOfTextBlock() === true) ? true : false;
		wheretoinsert = (atstart && !atend) ? "before" : "after";
		elemtype = (wheretoinsert === "before" || atend) ? "p" : _textblock.selection.getStartTextBlockNode().tagName;
		
		//console.log("atstart - " + atstart+ "\natend - " + atend + "\nwhere - " + wheretoinsert);
		
		// Tidy MozBr's in original element
		_textblock.mozBrs.tidy(elem);
		
		// Save and the delete the content after the caret from the original element
		if(!atstart && !atend) {//wheretoinsert === "after") {
			if (document.createRange) {
				range = lasso().selectNodeContents( elem ).setStartToRangeStart(splitpoint); // Odd bug (at least in chrome) where savedRange is already to the end.
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
				range.setStartToRangeEnd(splitpoint);
				savedElemContent = range.getHTML();
				range.getNative().text = "";
			}
		}
		else {
			savedElemContent = "";
		}
		
		/*result = _textblock.insert(elem, elemtype, false, wheretoinsert, savedElemContent); */
		
		// Create new element for inserting
		newTextBlock = _textblock.create(elemtype, savedElemContent);
		if (!newTextBlock) return false;
		
		// Ask (ghost) parent to insert new element into page
		parent = ghostedit.dom.getParentGhostBlock(elem);
		handler = parent.getAttribute("data-ghostedit-handler");
		result = ghostedit.plugins[handler].dom.addchild (parent, wheretoinsert, elem, newTextBlock, {"contentlength": savedElemContent.length});
		
		if (!result) return false;
		/* IF !result, replace saved and deleted content after cursor */
		
		// Workaround for ie (6?) bug which doesn't allow an empty element to be selected
		newTextBlock.innerHTML = "dummy";
		lasso().selectNode(newTextBlock).select();
		newTextBlock.innerHTML = savedElemContent;
		
		// Tidy MozBrs (previous code section often) removes all MozBrs)
		_textblock.mozBrs.tidy(newTextBlock);
		
		// Set caret to start of new element
		if(wheretoinsert === "before") {
			range = lasso().setCaretToBlockStart(elem);
		}
		else {
			range = lasso().setCaretToBlockStart(newTextBlock);
		}
		
		// If using selection, set caret to range position
		if (useselection) {
			range.select();
			ghostedit.selection.save();
		}
		
		// block1 = first in dom; block2 = second in dom
		return {
			"block1": wheretoinsert === "before" ? newTextBlock : elem,
			"block2": wheretoinsert === "before" ? elem :newTextBlock,
			"caretposition": range
		};
	};
	
	_textblock.mozBrs = {		
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
			_textblock.mozBrs.clear(elem);
			if(ghostedit.useMozBr) {
				_textblock.mozBrs.insert(elem);
			}
		}
		
	};
	
	_textblock.insert = {
		character: function (character) {
			if(ghostedit.selection.saved.type === "textblock") {
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
	};
		
	_textblock.format = {
		init: function () {
			
			ghostedit.api.format = ghostedit.api.format || {};
			
			ghostedit.api.format.setStyle = function (tagname, newclass) {
				_textblock.format.formatSelected(_textblock.format.setTagType, {"tagname": tagname,"newclass": newclass});
			};
			
			ghostedit.api.format.alignText = function (alignDirection) {
				if (!/left|right|center|justify/.test(alignDirection)) return false;
				_textblock.format.formatSelected(_textblock.format.alignText, {"alignDirection": alignDirection});
			};
			
			ghostedit.api.format.bold = function () {
				_textblock.format.formatSelected(_textblock.format.bold);
			};
			
			ghostedit.api.format.italic = function () {
				_textblock.format.formatSelected(_textblock.format.italic);
			};
			
			ghostedit.api.format.underline = function () {
				_textblock.format.formatSelected(_textblock.format.underline);
			};
			
			ghostedit.api.format.strikethrough = function () {
				_textblock.format.formatSelected(_textblock.format.strikethrough);
			};
			
			ghostedit.api.format.textColor = function (color) {
				_textblock.format.formatSelected(_textblock.format.textColor, {"color": color});
			};
		},
		
		useCommand: function (commandType, param) {
			//var i, nodes, node, selrange, startofblock, endofblock;
			//if (typeof param == "undefined") { param = null; }
			//if (ghostedit.selection.saved.type !== "text") return false;
			//ghostedit.history.saveUndoState();
			document.execCommand(commandType, false, param);
			//ghostedit.selection.save();
			//ghostedit.history.saveUndoState();
		},
		
		getNextNode: function (node) {
			if (node.firstChild) return node.firstChild;
			while (node) {
				if (node.nextSibling) return node.nextSibling;
				node = node.parentNode;
			}
		},
		
		getNodesInRange: function (range) {
			var start = range.getStartNode(),
			end = range.getEndNode(),
			commonAncestor = range.getParentNode(),
			nodes = [],
			node;
			
			// walk parent nodes from start to common ancestor
			for (node = start.parentNode; node; node = node.parentNode) {
				nodes.push(node);
				if (node === commonAncestor) break;
			}
			nodes.reverse();
			
			// walk children and siblings from start until end is found
			for (node = start; node; node = _textblock.format.getNextNode(node)) {
				nodes.push(node);
				if (node === end) break;
			}
			
			return nodes;
		},
		
		useCommandOnWord: function (command) {
			var range, marker;
			if (ghostedit.selection.savedRange.isCollapsed() && _textblock.selection.getStartTextBlockNode()) {
				range = ghostedit.selection.savedRange.clone();
				if (document.createRange) {
					marker = document.createElement("span");
					marker.id = "ghostedit_marker";
					range.getNative().insertNode(marker);
				}
				if (!document.createRange && document.selection) {
					range.getNative().pasteHTML("<span id='ghostedit_marker'>z</span>");
				}
				range.selectNode("ghostedit_marker");
				range = _textblock.selection.extendtoword(range, true);
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
			_textblock.format.useCommand(command);
			
			if (document.getElementById("ghostedit_marker")) {
				lasso().selectNode("ghostedit_marker").select();
				document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
			}
			ghostedit.selection.save();
		},
		
		bold: function () {
			_textblock.format.useCommand("bold");
		},
		
		italic: function () {
			_textblock.format.useCommand("italic");
		},
		
		underline: function () {
			_textblock.format.useCommand("underline");
		},
		
		strikethrough: function () {
			_textblock.format.useCommand("strikethrough");
		},
		
		textColor: function (color) {
			_textblock.format.useCommand("foreColor",color);
		},
		
		
		formatSelected: function (formatFunc, params) {
			var elem, startpara, endpara, oldelem, doend, i, descendantblocks;
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			
			startpara = _textblock.selection.getStartTextBlockNode();
			endpara = _textblock.selection.getEndTextBlockNode();
		
			if (startpara && endpara) {
				elem = startpara;
				doend = false;
				do {
					if (elem === ghostedit.el.rootnode || elem === null) break;
					
					
					
					if (_textblock.isTextBlock(elem)) {
						if (elem === endpara) doend = true;
						elem = _textblock.format.formatTextBlock(elem, ghostedit.selection.saved.data.clone(), formatFunc, params);
						if (doend) break;
						elem = elem.nextSibling ? elem.nextSibling : elem.parentNode;
						continue;
					}
					else if (ghostedit.dom.isDescendant(elem, endpara)) {
						elem = ghostedit.dom.getFirstChildElement(elem);
						continue;
					}
					else {
						oldelem = elem; //necessary because setTagType kills list item (and if no list item, then no nextSibling)
						elem = elem.nextSibling ? elem.nextSibling : elem.parentNode;
							
						descendantblocks = oldelem.getElementsByTagName("*");
						for(i = 0; i < descendantblocks.length; i += 1) {
							if (_textblock.isTextBlock(descendantblocks[i])) {
								_textblock.format.formatTextBlock(descendantblocks[i], ghostedit.selection.saved.data.clone(), formatFunc, params);
							}
						}
					}
					
				
				}
				while (true);
				
				ghostedit.selection.save();
				ghostedit.history.saveUndoState();
			}
			
			
			ghostedit.history.saveUndoState();
		},
		
		formatTextBlock: function (textblock, range, formatFunc, params) {
			var startofblock, endofblock, newelem;
			
			if (!params) params = {};
			params.textblock = textblock;
			
			// Clone range to avoid reference errors
			range = range.clone();
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(textblock);
			endofblock = lasso().setCaretToEnd(textblock);
			
			// If range doesn't intersect textblock return false
			//console.log(range.compareEndPoints("EndToStart", startofblock));
			//console.log(range.compareEndPoints("StartToEnd", endofblock));
			if (range.compareEndPoints("EndToStart", startofblock) === -1 || range.compareEndPoints("StartToEnd", endofblock) === 1) return false;
			
			// If range starts before block, move start of selrange to start of block
			if (range.compareEndPoints("StartToStart", startofblock) === -1) range.setStartToRangeStart(startofblock);
			
			// If range end after block, move end of selrange to end of block
			if (range.compareEndPoints("EndToEnd", endofblock) === 1) range.setEndToRangeEnd(endofblock);
			
			ghostedit.selection.saved.data.clone().saveToDOM("ghostedit_format");
			//if(textblock.id === "ghostedit_textblock_4") return;
			range.select();
			newelem = formatFunc(params);
			
			lasso().restoreFromDOM("ghostedit_format").select();
			ghostedit.selection.save();
			
			return newelem && newelem.nodeType !== undefined ? newelem : textblock;
		},
		
		alignText: function(params) {
				var elem = lasso().setToSelection().getParentElement();
				while (!ghostedit.dom.isGhostBlock(elem)) {
					elem = elem.parentNode;
					if (elem === null) return false;
				}
				if (!_textblock.isTextBlock(elem)) return false;
				elem.style.textAlign = params.alignDirection;
		},
		

		// .tagName is readonly -> need to remove element and add new one
		setTagType: function (params) {
			var target, tagtype, newclass, parent, targetid, newTextBlock;
			
			target = params.textblock;
			tagtype = params.tagname;
			newclass = params.newclass;
			
			// Retrieve target node
			//target = target || ghostedit.selection.nodepath[0];
			if (!_textblock.isTextBlock(target)) return false;
			
			// Save id of target
			targetid = 'ghostedit_textblock_' + target.id.replace("ghostedit_textblock_","");
			
			// Create replacement element, and copy over attributes/html
			newTextBlock = _textblock.create(tagtype);
			newTextBlock.appendChild(ghostedit.dom.extractContent(target));
			_textblock.mozBrs.tidy(newTextBlock);
			newTextBlock.setAttribute("style", target.getAttribute("style"));
			if (newclass !== undefined) newTextBlock.className = newclass;

			
			// Use naive DOM manipulation because just doing an in place swap
			parent = target.parentNode;
			target.id = "";
			parent.insertBefore(newTextBlock, target);
			parent.removeChild(target);
			
			// Set id of new TextBlock
			newTextBlock.id = targetid;
			
			return newTextBlock;
		}
	};
	
	ghostedit.api.plugin.register("textblock", _textblock);
})(window);
(function (window, undefined) {
	
	var _container = {},
	lasso = window.lasso,
	ghostedit = window.ghostedit;
	
	_container.enable = function () {
		return true;
	};
		
	_container.dom = {
	
		addchild: function (target, wheretoinsert, anchorelem, newElem) {
			
			if (wheretoinsert === "before") {
				target.insertBefore(newElem, anchorelem);
			}
			else {
				if (anchorelem.nextSibling !== null) {
					target.insertBefore(newElem, anchorelem.nextSibling);
				}
				else {
					target.appendChild(newElem);
				}
			}
			
			return true;
		},
		
		removechild: function (target, child) {
			if (!target || !child) return false;
			
			target.removeChild(child);
			
			return true;
		}
		
		// Not currently needed, but comments left for easier future implementation
		/*deleteevent: function (target, sourcedirection, params) {
			switch (sourcedirection) {
				case "ahead":
					// Backspace was pressed at the start of the element after the container
				break;
				case "behind":
					// Delete was pressed at the end of the element before the container
				break;
				case "top":
					// Backspace was pressed at the start of the first child GhostBlock of the container
				break;
				case "bottom":
					// Delete was pressed at the end of the last child GhostBlock the container
				break;
			}
			return false;
		}*/
	};
		
	_container.selection = {
		deleteContents: function (container, collapse) {
			var i, 
			firstchildblock, lastchildblock, startofblock, endofblock, atverystart = false, atveryend = false,
			startblock, endblock, cblock, startcblock, endcblock, childblocks, dodelete, selrange, handler;
			
			// Temporary selection range to avoid changing actual saved range
			if(ghostedit.selection.saved.type !== "textblock") return false;
			selrange = ghostedit.selection.saved.data;
			
			// Get first and last child ghostblock
			childblocks = container.childNodes;
			firstchildblock = ghostedit.dom.getFirstChildGhostBlock(container);
			lastchildblock = ghostedit.dom.getLastChildGhostBlock(container);
			
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
				startblock = selrange.getStartNode();
				if (!ghostedit.dom.isGhostBlock(startblock)) startblock = ghostedit.dom.getParentGhostBlock(startblock);
			}
			
			// If selrange ends after or at block, set endblock to the last child ghostblock
			if (selrange.compareEndPoints("EndToEnd", endofblock) !== -1) {
				atveryend = true;
				endblock = lastchildblock;
			}
			// Otherwise, set child ghostblock containing the end of the selection
			else {
				endblock = selrange.getEndNode();
				if (!ghostedit.dom.isGhostBlock(endblock)) endblock = ghostedit.dom.getParentGhostBlock(endblock);
			}
			
			startcblock = startblock;
			while(!ghostedit.dom.isChildGhostBlock(startcblock, container)) startcblock = ghostedit.dom.getParentGhostBlock(startcblock);
			endcblock = endblock;
			while(!ghostedit.dom.isChildGhostBlock(endcblock, container)) endcblock = ghostedit.dom.getParentGhostBlock(endcblock);
			
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
			
			//ghostedit.textblock.selection.deleteContents(lastchildblock);
			
			//alert("start - " + startblock.id + "\nend - " + endblock.id);
			
			// Cycle through SELECTED child ghostblocks and call delete method
			dodelete = false;
			for(i = 0; i < childblocks.length; i += 1) {
				
				cblock = childblocks[i];
				if ( !ghostedit.dom.isGhostBlock(cblock) ) continue;
				handler = cblock.getAttribute("data-ghostedit-handler");
				
				if (cblock.id === startcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = true;
					continue;
				}
				else if (cblock.id === endcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = false;
					break;
				}
				
				if (dodelete) {
					container.removeChild(childblocks[i]);
					i--;
				}
					
			}
			
			
			// If the first and last elements in the selection are the same type, then merge
			if(startcblock.getAttribute("data-ghostedit-elemtype") === endcblock.getAttribute("data-ghostedit-elemtype")) {
				lasso().setToSelection().saveToDOM("ghostedit_container_deleteselection");
				ghostedit.plugins[startcblock.getAttribute("data-ghostedit-elemtype")].merge(startcblock, endcblock, collapse);
				lasso().restoreFromDOM("ghostedit_container_deleteselection").select();
				//if (!ghostedit.dom.getParentGhostBlock(endcblock)) lasso().setToSelection().collapseToStart().select();
				//^^tests whether endcblock is still in the document, i.e. whether a merge took place
			}
			
			// If container has no children left, create empty <p> element
			if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
				container.appendChild(ghostedit.plugins.textblock.create("p"));
			}
			
			// Place caret where the selection was
			//lasso().setCaretToStart(endelem).select();

			return true;
		}
	};
	
	_container.inout = {
		importHTML: function (sourcenode) {
			var container, result, i, elemcount, elem, tagname;
			if (!sourcenode || sourcenode.childNodes.length < 1) return false;
			
			container = _container.create();
			
			// For each source child node, check if appropriate import handler exists, if so then call it on the node
			for (i = 0; i < sourcenode.childNodes.length; i += 1) {
				elem = sourcenode.childNodes[i];
				if (elem.nodeType !== 1 && elem.nodeType !== 3)  continue;
				
				tagname = (elem.nodeType === 3) ? "#textnode" : elem.tagName.toLowerCase();
				/*if (handler = ghostedit.inout.importhandlers[tagname]) {
					result = ghostedit.plugins[handler].inout.importHTML(elem)
					if (result && ghostedit.dom.isGhostBlock(result)) {
						container.appendChild(result);
					}
				}*/
				if (ghostedit.inout.importhandlers[tagname]) {
					result = ghostedit.inout.importhandlers[tagname].call(this, elem);
					if (result && ghostedit.dom.isGhostBlock(result)) {
						container.appendChild(result);
					}
				}
				else if (elem.childNodes.length > 0) {
					elemcount = elem.childNodes.length;
					elem.parentNode.insertBefore(ghostedit.dom.extractContent(elem), elem);
					elem.parentNode.removeChild(elem);
					i -= 1;
				}
			}
			
			// Check any GhostBlock children have been added, else add empty paragraph
			if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
				container.appendChild(ghostedit.plugins.textblock.create("p"));
			}
			
			return container;
		},
		
		exportHTML: function (target/*, includeself*/) { // Shouldn't be used without first using export prepare functions
			if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "container") return false;
			var i = 0, elem, blockreturn, finalCode = "", blockcount = 0, snippet, handler;
			
			//if (target.getAttribute("data-ghostedit-isrootnode") === true) isrootnode = true;
			
			// Allows for inclusion of enclosing <div> if wanted in future, may also want to retreieve properties
			//if (includeself === true) finalCode =+ "<div>";
			
			for (i = 0; i < target.childNodes.length; i += 1) {
				elem = ghostedit.dom.isGhostBlock( target.childNodes[i] ) ? target.childNodes[i] : false;
				if (!elem) continue;
				
				handler = elem.getAttribute("data-ghostedit-handler");
				if (!handler || !ghostedit.plugins[handler]) continue;
				
				blockreturn = ghostedit.plugins[handler].inout.exportHTML(elem);
				
				if (blockreturn) {
					finalCode += blockreturn.content;
					blockcount++;
				}
				
				//Create snippet from first 3 paragraphs
				if (blockcount <= 3){
					snippet = finalCode;
				}
			}
			
			return {content: finalCode, snippet: snippet};
		}
	};
	
	_container.paste = {
		handle: function (target, source, position) {
			var sel, anchor, newnode, dummy;
			if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isGhostBlock(source)) return false;
			//if (position.isfirst || position.islast) return false;
			
			sel = ghostedit.selection.saved.data;
			anchor = sel.clone().collapseToStart().getParentElement();
			sel.saveToDOM("ghostedit_paste_start");
			
			if (anchor === target) {
				/* Just use range marker as dummy elem
				dummy = document.createElement("span");
				dummy.innerHTML = "&#x200b";
				dummy.id = "ghostedit_paste_dummy";
				sel.clone().collapseToStart().insertNode(dummy);*/
				dummy = document.getElementById("ghostedit_paste_start_range_start");
				anchor = ghostedit.dom.getPreviousSiblingGhostBlock(dummy) || dummy;
			}
			
			while (anchor.parentNode !== target) {
				anchor = anchor.parentNode;
				if (anchor === null || !anchor.parentNode) return true;
			}

			newnode = source.cloneNode(true);
			/*if (position.islast) {
				sel.removeDOMmarkers("ghostedit_paste");
				newnode.innerHTML = "<span id='ghostedit_paste_range_end'>&#x200b;</span>" + newnode.innerHTML;
			}
			else {
				document.getElementById("ghostedit_paste_range_start").parentNode.removeChild(document.getElementById("ghostedit_paste_range_start"));
			}*/
			lasso().removeDOMmarkers("ghostedit_paste_start");
			newnode.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t3'>&#x200b;</span>";
			
			_container.dom.addchild(target, "after", anchor, newnode);
			
			if (dummy && dummy.parentNode) dummy.parentNode.removeChild(dummy);
			return true;
			
		}
	};
	
	// TODO remove this function is favour of dom.isChildGhostBlock
	_container.isChildGhostBlock = function (elem, childblocks) {
		var i;
		if (!elem) return false;
		if (elem.nodeType !== 1) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === undefined) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === false) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === null) return false;
		for(i = 0; i < childblocks.length; i += 1) {
			if (elem === childblocks[i]) {
				return true;
			}
		}
		return false;
	};
	
	_container.create = function () {
		var newElem;
		// Create element, and assign id and content
		newElem = document.createElement("div");
		ghostedit.blockElemId += 1;
		newElem.id = "ghostedit_container_" + ghostedit.blockElemId;
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "container");
		newElem.setAttribute("data-ghostedit-handler", "container");
		
		return newElem;
	};
	
	_container.focus = function (target) {
		var firstchild, handler;
		if (!target || target.nodeType !== 1 || target.getAttribute("data-ghostedit-elemtype") !== "container") return false;
		
		// Get first child of container
		firstchild = ghostedit.dom.getFirstChildGhostBlock (target);
		if (!firstchild) return false;
		
		handler = firstchild.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].focus(firstchild);
		
		return true;
	};
	
	ghostedit.api.plugin.register("container", _container);
})(window);