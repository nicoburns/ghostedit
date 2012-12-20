(function (window, undefined) {
	
	var _clipboard = {}, _paste, _cut,
	lasso = window.lasso,
	ghostedit = window.ghostedit;
	
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
		console.log("raw paste content");
		console.log (ghostedit.el.rootnode.cloneNode(true));
		pastenode = ghostedit.plugins.container.inout.importHTML(ghostedit.el.rootnode);
		console.log ("processed content");
		console.log (pastenode.innerHTML);
		
		// Restore undo data, and restore editor content
		ghostedit.history.undoData = _paste.savedundodata;
		ghostedit.history.undoPoint = _paste.savedundopoint;
		ghostedit.history.restoreUndoPoint(ghostedit.history.undoPoint);
		
		console.log(ghostedit.selection.saved);
		// Delete selection contents if selection is non-collapsed
		ghostedit.selection.deleteContents();
		ghostedit.selection.save();
		
		console.log(pastenode);
		
		// If no content was pasted, return
		source = ghostedit.dom.getFirstChildGhostBlock(pastenode);
		if (!source) return;
		if(ghostedit.selection.saved.data.isCollapsed()){
			collapsed = true;
			ghostedit.selection.saved.data.saveToDOM("ghostedit_paste_start");
		}
		else {
			collapsed = false;
			ghostedit.selection.saved.data.clone().collapseToStart().saveToDOM("ghostedit_paste_start");
			ghostedit.selection.saved.data.clone().collapseToEnd().saveToDOM("ghostedit_paste_end");
		}
		
		
		console.log("test--------------------------------");
		// Call handler on first pasted node
		result = false;
		_paste.trycounter = 0;
		ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
		target = ghostedit.selection.saved.data.getParentNode();
		if (!ghostedit.dom.isGhostBlock(target)) target = ghostedit.dom.getParentGhostBlock(target);
		while (!result) {
			if (!target) {
				hasmerged = false;
				break;
			}
			
			handler = target.getAttribute("data-ghostedit-handler");
			if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].paste) break;
			
			position = {"isfirst": true,
				"islast": (ghostedit.dom.getFirstChildGhostBlock(pastenode) === source) ? true : false,
				"collapsed": collapsed};
			
			console.log("Call handler: (first)" + handler);
			console.log(source);
			result = ghostedit.plugins[handler].paste.handle (target, source, position);
			console.log("result: " + result);
			if (result) {
				hasmerged = true;
				source.parentNode.removeChild(source);
				break;
			}
			if (!result) target = ghostedit.dom.getParentGhostBlock(target);
			ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
		}

		
		// Call handler on last pasted node
		source = ghostedit.dom.getLastChildGhostBlock(pastenode);
		if (source && (collapsed === false || hasmerged === false)) {
			_paste.trycounter = 0;
			result = false;
			
			if(ghostedit.selection.saved.data.isSavedRange("ghostedit_paste_end")) {
				ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_end", false);
			}
			else {
				ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
			}
			target = ghostedit.selection.saved.data.getParentNode();
			if (!ghostedit.dom.isGhostBlock(target)) target = ghostedit.dom.getParentGhostBlock(target);
			
			while (!result) {
				
				//ghostedit.selection.saved.data.select();
				if (!target) break;
				
				handler = target.getAttribute("data-ghostedit-handler");
				if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].paste) break;

				console.log("Call handler (last): " + handler);
				console.log(source);
				result = ghostedit.plugins[handler].paste.handle (target, source, {"isfirst": false, "islast": true, "collapsed": collapsed});
				console.log("result: " + result);
				if (result) {
					source.parentNode.removeChild(source);
					break;
				}
				if (!result) target = ghostedit.dom.getParentGhostBlock(target);
				if(ghostedit.selection.saved.data.isSavedRange("ghostedit_paste_end")) {
					ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_end", false);
				}
				else {
					ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
				}
				
				if (_paste.trycounter++ > 20) return;
			}
		}
		
		// Loop through remaining nodes
		console.log(pastenode);
		source = ghostedit.dom.getFirstChildGhostBlock(pastenode);
		_paste.trycounter = 0;
		while (source) {
			result = false;
			while (!result) {
				ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", false);
				if (lasso().isSavedRange("ghostedit_paste_end")) {
					ghostedit.selection.saved.data.setEndToRangeEnd(lasso().restoreFromDOM("ghostedit_paste_end", false));
				}
				ghostedit.selection.saved.data.select();
				
				target = ghostedit.selection.saved.data.getParentNode();
				if (!ghostedit.dom.isGhostBlock(target)) target = ghostedit.dom.getParentGhostBlock(target);
				if (!target) break;
				
				handler = target.getAttribute("data-ghostedit-handler");
				if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].paste) break;

				console.log("Call handler: " + handler);
				console.log(source);
				result = ghostedit.plugins[handler].paste.handle (target, source, {"isfirst": false, "islast": false, "collapsed": collapsed});
				console.log("result: " + result);
				if (_paste.trycounter++ > 20) return;
			}
			
			source = ghostedit.dom.getNextSiblingGhostBlock(source);
		}
		
		ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_start", true).select();
		if (ghostedit.selection.saved.data.isSavedRange("ghostedit_paste_end")) {
			ghostedit.selection.saved.data.restoreFromDOM("ghostedit_paste_end", true).select();
		}

		/*if (!result) {
			i--;
			blocks = ghostedit.plugins[handler].split(target);
			//range = lasso().setStartToRangeStart(lasso().selectNodeContents(blocks.block1));
			//range.setEndToRangeEnd(lasso().selectNodeContents(blocks.block2));
			//elem = range.getParentNode();
			//if (!ghostedit.dom.isGhostBlock(elem)) ghostedit.dom.getParentGhostBlock(elem);
			target = ghostedit.dom.getParentGhostBlock(blocks.block1);
			child = blocks.block1;
			while (!ghostedit.dom.isChildGhostBlock(child, target)) {
				child = ghostedit.dom.getParentGhostBlock(child);
			}
			handler = target.getAttribute("data-ghostedit-handler");
		}*/
		
		ghostedit.selection.save();
		
		ghostedit.history.undoData = _paste.savedundodata;
		ghostedit.history.undoPoint = _paste.savedundopoint;
		ghostedit.history.saveUndoState();
		
		if (_paste.triedpasteimage) {
			ghostedit.event.trigger("ui:message", {message: "You cannot paste images into the editor, please use the add image button instead", time: 2, color: "warn"});
		}
		
		ghostedit.event.trigger("clipboard:paste:after");
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
		
		// Delete selection contents if selection is non-collapsed
		ghostedit.selection.deleteContents();
		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_clipboard.paste = _paste;
	_clipboard.cut = _cut;
	window.ghostedit.clipboard = _clipboard;
})(window);