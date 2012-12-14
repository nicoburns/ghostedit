/* Lasso range library version 1.1.0

Name:				Lasso
Description:			Lightweight, crossbrowser javascript library for creating and modifying ranges. Used by the GhostEdit editor.
Licence:				Dual licensed under MIT and LGPL licenses.
Browser Support:		Internet Explorer 6+, Mozilla Firefox 3.5+, Google Chrome, Apple Safari 3+, Opera 10.50+, Any other browser that supports DOMranges or TextRanges
Author:				Nico Burns <nico@nicoburns.com>
Website:				http://ghosted.it/lasso
Version:				1.4.0
Release Date:			1st July 2012

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
	other:
		clone()
		saveToDOM()
		restoreFromDOM()
		isSavedRange()
		removeDOMmarkers()
		bookmarkify() [ie <= 8 only]
		unbookmarkify() [ie <= 8 only]

Example usage:

	1. Set the caret to the end of an element with ID 'testelem':
	lasso().setCaretToEnd('testelem').select();

	2. Get the currently selected text
	lasso().setToSelection().getText();
*/

var lasso = (function(){
	//define local range object to be returned at end
	var r = {
		saved: null,
		endpoint: null,
		startpoint: null,
		bookmark: null,
		textrange: false,
		domrange: false
	}
		
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
	}
	
	r.setToEmpty = function () {
		if (r.domrange) {
			r.saved = document.createRange();
		}
		else if (r.textrange) {
			r.saved = document.body.createTextRange();
		}
		return r;
	}
	
	
	/* Native Range Functions */
	
	r.setFromNative = function (nativerange) {
		r.saved = nativerange;
		return r;
	}
	
	r.getNative = function () {
		return r.saved;
	}
	
	
	/* Selection Functions */
	
	r.setToSelection = function () {
		if(r.domrange) {
			if(getSelection().rangeCount > 0) {
				r.saved = getSelection().getRangeAt(0).cloneRange();
			}
		}
		else if (r.textrange) {
			r.saved = document.selection.createRange();
		}
		return r;
	}
	
	r.select = function () {
		if (r.domrange) {
			var s = getSelection();
			if (s.rangeCount > 0) s.removeAllRanges();
			s.addRange(r.saved);
		}
		else if (r.textrange) {
			r.saved.select();
		}
		return r;
	}
	
	r.clearSelection = function () {
		if (r.domrange) {
			var s = getSelection();
			if (s.rangeCount > 0) s.removeAllRanges();
		}
		else if (r.textrange) {
			document.selection.empty();
		}
		return r;
	}
	
	
	/* Modify Range Functions */
	
	r.collapseToStart = function () {
		r.saved.collapse(true);
		return r;
	}
	
	r.collapseToEnd = function () {
		r.saved.collapse(false);
		return r;
	}
	
	r.setStartToRangeStart = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.startContainer, range.startOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("StartToStart", range);
		}
		return r;
	}
	
	r.setStartToRangeEnd = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("StartToEnd", range);
		}
		return r;
	}
	
	r.setEndToRangeStart = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setStart(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("EndToStart", range);
		}
		return r;
	}
	
	r.setEndToRangeEnd = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			r.saved.setEnd(range.endContainer, range.endOffset);
		}
		else if (r.textrange) {
			r.saved.setEndPoint("EndToEnd", range);
		}
		return r;
	}
	
	
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
	}
	
	r.pasteText = function (text, collapse) {
		if(typeof collapse == "undefined") collapse = true;
		
		r.deleteContents()
		
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
	}
	
	r.insertNode  = function (node, collapse) {
		var div;
		if(typeof collapse == "undefined") collapse = true;
		
		r.deleteContents()
		
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
	}
	
	/* Get Content Functions */

	r.getText = function () {
		if (r.domrange) {
			return r.saved.toString();
		}
		else if (r.textrange) {
			return r.saved.text;
		}
	}

	r.extractText = function () {
		var text = r.getText();
		r.deleteContents();
		return text;
	}
	
	r.getHTML = function () {
		var tempelem, docfrag
		if (r.domrange) {
			docfrag = r.saved.cloneContents();
			tempelem = document.createElement("div");
			tempelem.appendChild(docfrag);
			return tempelem.innerHTML;
		}
		else if (r.textrange) {
			return r.saved.htmlText;
		}
	}
	
	r.extractHTML = function () {
		var html = r.getHTML();
		r.deleteContents();
		return html;
	}
	
	
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
	}
		
	r.selectNode = function (elem) {
		if(typeof elem === "string") elem = document.getElementById(elem);
		
		if (r.domrange) {
			r.saved.selectNodeContents(elem);
		}
		else if (r.textrange) {
			r.saved.moveToElementText(elem);
		}
		return r;
	}
	
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
	}
	
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
	}
	
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
	}
	
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
	}
	
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
	}

	
	/* Range Information Functions */
	
	r.isCollapsed = function () {
		if (r.domrange) {
			return r.saved.collapsed;
		}
		else if (r.textrange) {
			//return r.saved.compareEndPoints("StartToEnd", r.saved) === 0 ? true : false;
			return r.saved.isEqual(r.clone().collapseToStart().saved);
		}
	}
	
	r.compareEndPoints = function (how, range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.domrange) {
			// Note that EndToStart and StartToEnd are reversed (to make compatible with ie order)
			var howlookup = {"StartToStart": Range.START_TO_START,
						"StartToEnd": Range.END_TO_START,
						"EndToStart": Range.START_TO_END,
						"EndToEnd": Range.END_TO_END};				
			how = howlookup[how];
			return r.saved.compareBoundaryPoints(how, range);
		}
		else if (r.textrange) {
			return r.saved.compareEndPoints(how, range);
		}
	}
	
	r.isEqualTo = function (range) {
		if (range && range.saved) range = range.getNative();
		
		if (r.compareEndPoints("StartToStart", range) !== 0) return false;
		if (r.compareEndPoints("EndToEnd", range) !== 0) return false;
		
		return true;
	}
	
	r.getStartNode = function () {
		if (r.domrange) {
			return r.saved.startContainer;
		}
		else if (r.textrange) {
			var range = r.saved.duplicate();
			range.collapse(true);
			return range.parentElement();
		}
	}
	
	r.getEndNode = function () {
		if (r.domrange) {
			return r.saved.endContainer;
		}
		else if (r.textrange) {
			var range = r.saved.duplicate();
			range.collapse(false);
			return range.parentElement();
		}
	}
	
	r.getParentNode = function () {
		if (r.domrange) {
			return r.saved.commonAncestorContainer;
		}
		else if (r.textrange) {
			return r.saved.parentElement();
		}
	}
	
	r.getStartElement = function () {
		return r.util.getParentElement( r.getStartNode() );
	}
	
	r.getEndElement = function () {
		return r.util.getParentElement( r.getEndNode() );
	}
	
	r.getParentElement = function () {
		if (r.domrange) {
			return r.util.getParentElement( r.saved.commonAncestorContainer);
		}
		else if (r.textrange) {
			return r.saved.parentElement();
		}
	}


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
	}
	
	/* Save and Restore Functions */
	
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
			smark.className = z++;
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
	}
	
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
	}
	
	r.isSavedRange = function (id) {
		if (!id) id = "lasso";
		
		return (document.getElementById(id + "_range_start")) ? true : false;
	}
	
	r.removeDOMmarkers = function (id) {
		var smark, emark;
		if (!id) id = "lasso";
		
		smark = document.getElementById(id + "_range_start");
		emark = document.getElementById(id + "_range_end");
		
		if (smark) smark.parentNode.removeChild(smark);
		if (emark) emark.parentNode.removeChild(emark);
	}
	
	
	/* IE <= 8 Only Functions */
	
	r.bookmarkify = function (rootnode) {
		if (r.domrange) {
			var node, startnodeoffsets, endnodeoffsets, b = {};
			if (!rootnode || !rootnode.nodeType) return r;
			
			// Save start and end offset to bookmark
			b.startoffset = r.saved.startOffset;
			b.endoffset = r.saved.endOffset;
			
			// Get start node offset path relative to rootnode
			startnodeoffsets = []
			node = r.saved.startContainer;
			while (node !== rootnode) {
				startnodeoffsets.unshift(r.util.getNodeOffset(node));
				node = node.parentNode;
				if (node === null) return r;
			}
			
			// Get end node offset path relative to rootnode
			endnodeoffsets = []
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
	}
		
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
				r.bookmarkify()
			}
		}
		return r;
	}
	
	r.clearBookmark = function () {
		r.bookmark = false;
		return r;
	}
	
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
	}
	
	/* Utility, 'non-public' functions, used by other functions */
	
	r.util = { //Used only for next two functions (getStartElement and getEndElement)
		getParentElement: function (node) {
			if (node.nodeType != 1) {
				while (node.nodeType != 1) {
					node = node.parentNode;
					if (node == null) return null;
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
	}
	
	r.init();
	return r;
});

z = 0;