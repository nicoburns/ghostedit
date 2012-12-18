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