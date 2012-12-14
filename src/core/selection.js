(function(window, undefined) {
		
		var _selection = {
			savedRange: null,
			nodepath: [],
			saved: {type: "none", data: null},
			archived: {type: "none", data: null}
		}
		
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
				_selection.saved.data = sel;//.bookmarkify(ghostedit.editdiv);
				
				// Save to legacy variable
				_selection.savedRange = _selection.saved.data;
				
				ghostedit.event.trigger("selection:change");
				
				_selection.updatePathInfo();
				if (updateui) ghostedit.event.trigger("ui:update");
				return true;
			}
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
			
			if (sel.type !== _selection.saved.type) return false
			
			if (sel.type === "none") return true;
			// Else, call compare function from appropriate plugin
			if (ghostedit.plugins[sel.type] && ghostedit.plugins[sel.type].selection.compare) {
				return ghostedit.plugins[sel.type].selection.compare (sel.data, _selection.saved.data)
			}
			return false;
		};
		
		_selection.clear = function () {
			lasso().clearSelection();
			_selection.saved = {"type": "none", "data": null}
		};
		
		_selection.isInEditdiv = function (elem) {
			var elem, i;
			if (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
				while (elem.nodeType != 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
					if (elem == null) return false;
					elem = elem.parentNode;
					if (elem == null) return false;
				}
			}
			return true;
		};
		
		_selection.updatePathInfo = function (elem) {
			var bold = false, italic = false, underline = false, aelem = false, i, formatboxes;
			
			
			if (!elem) elem = _selection.savedRange.getParentNode();
			
			// If nodepath is same as before, don't bother calculating it again
			// below code DOES NOT equal above statement. (dom node can have moved)
			//if (elem === _selection.nodepath[0]) return true;
			
			_selection.nodepath = [];
			
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-isrootnode") != "true") {
					
					if (elem == null) return null;
					
					if (elem.nodeType == 1)	_selection.nodepath.push(elem);
					
					elem = elem.parentNode;
					
					if (elem == null) return false;
				}
			}
			
			// Make sure rootnode/editdiv is also included in path
			if (elem && elem.getAttribute("data-ghostedit-isrootnode") == "true") {
					_selection.nodepath.push(elem);
			}
		};
		
		_selection.getContainingGhostBlock = function () {			
			var node = _selection.savedRange.getParentNode()
			if (!node) return false;

			while (!ghostedit.dom.isGhostBlock(node)) {
				node = node.parentNode;
				if (node == null) return false;
			}
			
			return node;
		};
		
		window.ghostedit.selection = _selection;
})(window);