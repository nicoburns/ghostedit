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