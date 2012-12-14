(function(window, undefined) {
	window.ghostedit.init = function (placediv, options) {
		if (typeof placediv === "string") placediv = document.getElementById(placediv);
		var wrapdiv, workspace, uilayer, statusbar, elems, i, j, brNode, oldDocRoot, isImg, img, insertedelem, lastelem = false, htmlelem, plugin, handler;
		
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
		placediv.style.display = 'none';
		//placediv.parentNode.removeChild(placediv);
		ghostedit.sourceelem = placediv;
		
		// Create wrapper div that all other GhostEdit elements go in
		wrapdiv = document.createElement("div");
		wrapdiv.className = "ghostedit_wrapper";
		placediv.parentNode.insertBefore(wrapdiv, placediv);
		ghostedit.wrapdiv = wrapdiv;
		
		// Create workspace wrapper (div that contains editdiv and uilayer)
		workspace = document.createElement("div");
		workspace.id = "ghostedit_workspace";
		workspace.className = "ghostedit_workspace";
		wrapdiv.appendChild(workspace);
		ghostedit.workspace = workspace;
		
		// Create contextual ui layer
		uilayer = document.createElement("div");
		uilayer.id = "ghostedit_uilayer";
		uilayer.className = "ghostedit_uilayer";
		uilayer.innerHTML = "<span style='position: absolute; display: none;left: 0; top: 0;line-height: 0'>ie bug fix</span>";
		workspace.appendChild(uilayer);
		ghostedit.contextuallayer = uilayer;
		
		// If no preview URL specified, then hide the preview button.
		//if (!options.previewurl) document.getElementById("ghostedit_toolbar_button_preview").style.display = 'none';
		
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
		ghostedit.editdiv = ghostedit.inout.importHTML(ghostedit.sourceelem);
		workspace.appendChild(ghostedit.editdiv);
		
		// Focus the editor
		handler = ghostedit.editdiv.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].focus(ghostedit.editdiv);
		
		// Make sure that FF uses tags not CSS, and doesn't show resize handles on images
		try{document.execCommand("styleWithCSS", false, false);} catch(err){};//makes FF use tags for contenteditable
		try{document.execCommand("enableObjectResizing", false, false);} catch(err){};//stops resize handles being resizeable in FF
		
		// Save selection & setup undo
		ghostedit.selection.save();
		ghostedit.history.reset();
		ghostedit.history.saveUndoState();
		
		// Attach event handlers to document
		htmlelem = document.getElementsByTagName("html")[0];
		//ghostedit.util.addEvent(htmlelem, "click", ghostedit.selection.clear);
		ghostedit.util.addEvent(htmlelem, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(htmlelem, "drop", ghostedit.util.cancelEvent);
		
		// Attach handlers to wrapdiv
		ghostedit.util.addEvent(wrapdiv, "click", function( e ) { ghostedit.util.preventBubble(e) } );
		//ghostedit.util.addEvent(wrapdiv, "mouseup", function( e ) { ghostedit.util.preventBubble(e) } );
		//ghostedit.util.addEvent(wrapdiv, "mousedown", function( e ) { ghostedit.util.preventBubble(e) } );
		
		// Attach handlers to editdiv
		ghostedit.util.addEvent(ghostedit.editdiv, "click", ghostedit.selection.save);
		ghostedit.util.addEvent(ghostedit.editdiv, "mouseup", ghostedit.selection.save);
		ghostedit.util.addEvent(ghostedit.editdiv, "keyup", ghostedit.selection.save);
		ghostedit.util.addEvent(ghostedit.editdiv, "keydown", function(event) {ghostedit.event.keydown(this, event)});
		ghostedit.util.addEvent(ghostedit.editdiv, "keypress", function(event) {ghostedit.event.keypress(this, event)});
		ghostedit.util.addEvent(ghostedit.editdiv, "dragenter", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "dragleave", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "dragover", ghostedit.util.cancelEvent);
		ghostedit.util.addEvent(ghostedit.editdiv, "drop", ghostedit.util.cancelEvent);
		
		// Register UI context event listener 
		ghostedit.event.addListener ("ui:newcontext", function (params) {
			ghostedit.uicontext = params.context;
		});
		
		// Focus editdiv
		ghostedit.editdiv.focus();
		ghostedit.plugins.container.focus(ghostedit.editdiv);
		
		ghostedit.event.trigger("init:after");
	};
	
	var finish = function () {
		if(ghostedit.active) {
			ghostedit.active = false;
			ghostedit.sourceelem.innerHTML = ghostedit.inout.exportHTML().full;
			ghostedit.wrapdiv.parentNode.removeChild(ghostedit.wrapdiv);
			ghostedit.selection.savedRange = null;
			ghostedit.selection.saved = {type: "none", data : null};
			ghostedit.image.focusedimage = null;
			ghostedit.blockElemId = 0;
			ghostedit.imgElemId = 0;
			ghostedit.sourceelem.style.display = 'block';
			if(ghostedit.options.resetcallback) ghostedit.options.resetcallback();
		}
	};
})(window);