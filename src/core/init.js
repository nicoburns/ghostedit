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