(function(window, undefined) {
	
	var _event = {
		listeners: [],
		listenerid: 0,
		eventtypes: [],
		cancelKeypress: false, //allows onkeypress event to be cancelled from onkeydown event.
	};
		
	_event.keydown = function (elem,e) { //allows deleteIfBlank() to fire (doesn't work on onkeypress except in firefox)
		var keycode, ghostblock, handler, handled;
		ghostedit.selection.save(false);
		
		e = !(e && e.istest) && window.event != null ? window.event : e;
		keycode = e.keyCode != null ? e.keyCode : e.charCode;
		
		_event.trigger("input:keydown", {"event": event, "keycode": keycode});
		
		// Global shortcuts
		switch(keycode) {
			case 8: //backspace
			case 46: // delete key
				cancelKeypress = false;
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
					ghostedit.textblock.format.bold ();
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 73: //ctrl-i
				if (e.ctrlKey && !e.shiftKey) {
					ghostedit.textblock.format.italic ();
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 85: //ctrl-u
				if (e.ctrlKey) {
					ghostedit.textblock.format.underline ();
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
		
		// Not handled by one of above, pass to plugin keydown handlers
		ghostblock = ghostedit.selection.getContainingGhostBlock();
		while (true) {
			handler = ghostblock.getAttribute("data-ghostedit-handler");
			handled = ghostedit.plugins[handler].ghostevent("keydown", ghostblock, "self", {"keycode": keycode, "event": e});
			if (handled === true) break;
			
			ghostblock = ghostedit.dom.getParentGhostBlock(ghostblock);
			if (!ghostblock) break;
		}
		
		ghostedit.selection.save();
		return true;
	};

	_event.keypress = function (elem,e) {
		var keycode, ghostblock, handler, handled, currentDocLen, savedDocLen;
		ghostedit.selection.save();
		
		currentDocLen = ghostedit.editdiv.innerHTML.length;
		savedDocLen = ghostedit.history.undoData[ghostedit.history.undoPoint] !== undefined ? ghostedit.history.undoData[ghostedit.history.undoPoint].content.string.length : 0;
		//if (currentDocLen - savedDocLen >= 20 || savedDocLen - currentDocLen >= 20) ghostedit.history.saveUndoState();
		
		e = !(e && e.istest) && window.event != null ? window.event : e;
		keycode = e.keyCode != null ? e.keyCode : e.charCode;
		
		_event.trigger("input:keydown", {"event": event, "keycode": keycode});
		
		if (ghostedit.selection.saved.type !== "none" && !ghostedit.selection.savedRange.isCollapsed() && !e.ctrlKey) {
			ghostedit.selection.deleteContents();
		}
		
		
		// Global keyevents
		switch(keycode) {
			case 8: //cancel backspace event in opera if cancelKeypress = true
				if (_event.cancelKeypress == true) {
					_event.cancelKeypress = false;
					return ghostedit.util.cancelEvent ( e );
				}
			break;
			case 13: // Enter (don't allow default action for enter to happen)
				ghostedit.util.cancelEvent ( e );
			break;
		}
		
		ghostblock = ghostedit.selection.getContainingGhostBlock();
		while (true) {
			handler = ghostblock.getAttribute("data-ghostedit-handler");
			handled = ghostedit.plugins[handler].ghostevent("keypress", ghostblock, "self", {"keycode": keycode, "event": e});
			if (handled === true) break;
			
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
		if (!listeners[event] || !typeof(listeners[event]) === "object" || !(listeners[event] instanceof Array)) {
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
		if (!listeners[event] || !typeof(listeners[event]) === "object" || !(listeners[event] instanceof Array)) return;
		
		if (ghostedit.debug) {
			console.log(event);
			console.log(params);
		}
		
		for (i = 0; i < listeners[event].length; i++) {
			listeners[event][i].callback.call(this, params);
		}
	};

	_event.sendBackwards = function (eventtype, source, params) {
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
			
			result = _event.send (eventtype, target, direction, params);
			
			//if (result) alert("source - " + source.id + "\ntarget - " + target.id + "\nresult - " + result.handled);
			//else alert("source - " + source.id + "\ntarget - " + target.id + "\nresult - false");
			
			if (!result) return false;
			else if (result.handled === true) return true;
			
			tracker = target;
		}
	};

	_event.sendForwards = function (eventtype, source, params) {
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
			
			if ( !(result = _event.send (eventtype, target, direction, params)) ) return false;
			else if (result.handled === true) return true;
			
			tracker = target;
		}
	};

	_event.send = function (eventtype, target, fromdirection, params) {
		var handler, handled;

		if (!target) return false; // = no previous/next GhostBlock

		handler = target.getAttribute("data-ghostedit-handler");
		if (!ghostedit.plugins[handler] || !ghostedit.plugins[handler].ghostevent) return false; // = no handler for this elemtype
		
		handled = ghostedit.plugins[handler].ghostevent (eventtype, target, fromdirection, params);

		return {"handled": handled};
		
	};
	
	window.ghostedit.event = _event;
})(window);