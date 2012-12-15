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
		editwrap = ghostedit.editdiv;
		
		if (force !== true) force = false;
		
		ghostedit.event.trigger("presaveundostate");
		
		// Localise undo variables
		undoPoint = _history.undoPoint;
		undoData = _history.undoData;
		
		// Get latest undopoint into a variable
		undostate = undoData[undoPoint];
		if (!undostate) force = true;
		
		// Start capturing current editor state
		currentstate = {
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
		
		ghostedit.event.trigger("postsaveundostate");
	};
	
	_history.restoreUndoPoint = function (undopoint) {
		var undoData = _history.undoData,
		undostate = undoData[undopoint];
		if (!undostate || undostate.content.string.length < 1) return false;
		
		
		ghostedit.editdiv.innerHTML = "";//undoData[undopoint].selectioncontent;
		ghostedit.editdiv.appendChild(ghostedit.dom.cloneContent(undostate.content.dom));
		
		ghostedit.selection.restore (undostate.selection.type, undostate.selection.data);
		ghostedit.selection.save();
	};
	
	_history.undo = function () {
		var undoPoint = _history.undoPoint,
		undoData = _history.undoData,
		editwrap = ghostedit.editdiv;
		
		if (/*undoPoint < _history.undolevels  - 1 && //unlimited undo levels*/undoData[undoPoint+1] !== undefined && undoData[undoPoint+1].content.string.length > 0) {
			
			ghostedit.event.trigger("preundo");

			// There are unsaved changes, save current content and revert to last saved undopoint (was 0, but now 1 because current state saved in 0)
			if (undoData[undoPoint].content.string !== editwrap.innerHTML) {
				_history.saveUndoState();
				undoPoint = 1;
			}
			// Current state already saved, revert to previous saved one (undoPoint + 1)
			else {
				if (undoPoint === 0) {
					_history.saveUndoState();
				}
				undoPoint = _history.undoPoint;
				undoPoint+=1;
			}
			
			_history.restoreUndoPoint(undoPoint);
			
			_history.undoPoint = undoPoint;
			_history.undoData = undoData;

			ghostedit.event.trigger("postundo");
		
		}
	};
	
	_history.redo = function () {
		var undoPoint = _history.undoPoint,
		undoData = _history.undoData,
		editwrap = ghostedit.editdiv;
		
		if (undoPoint > 0 && undoData[undoPoint-1] !== undefined && undoData[undoPoint-1].content.string.length > 0) {
			
			ghostedit.event.trigger("preredo");
			
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
			
			ghostedit.event.trigger("postredo");
		}
	};
	
	window.ghostedit.history = _history;
})(window);