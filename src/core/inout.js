(function(window, undefined) {
	
	var _inout = {};
	
	_inout.init = function () {
		// Set initial variables
		_inout.reset();
		
		// Add listener to check whether the selection has changed since the last undo save
		ghostedit.event.addListener("selection:change", function () {ghostedit.history.selectionchanged = true});
		
		// Export undo and redo function to the api
		ghostedit.api.importHTML = function (source) { return _inout.importHTML(source); }
		ghostedit.api.exportHTML = function () { return _inout.exportHTML(); }
	};
	
	_inout.reset = function () {
		_inout.importhandlers = [];
	};
	
	_inout.importHTML = function (sourcenode) {
		var tagname, handler, domtree, editdiv;
		if (!sourcenode || sourcenode.childNodes.length < 1) return false;
		
		/*tagname = sourcenode.tagName.toLowerCase();
		if (handler = _inout.importhandlers[tagname]) {
			result = ghostedit.plugins[handler].inout.importHTML(insertedelem, elem)
			if (result) insertedelem = result;
		}*/
		
		// Call container import, and set resulting domnode's contenteditable to true
		editdiv = ghostedit.plugins.container.inout.importHTML(sourcenode);
		editdiv.className = "ghostedit_editdiv";
		editdiv.setAttribute("data-ghostedit-isrootnode", "true");
		editdiv.contentEditable = 'true';
		
		// Trigger 'import:after' event
		ghostedit.event.trigger("import:after", {"editdiv": editdiv});
		
		// Return editdiv container
		return editdiv;
	};
	
	_inout.exportHTML = function () {
		var editwrap = ghostedit.editdiv;
		var i = 0,elem,finalCode,params,handleResult,paracount,snippet, finalexport;
		
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
	
	_inout.registerimporthandler = function (importhandler/*, elements that can be handled*/) {
		var i, j, args, tag, list;
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