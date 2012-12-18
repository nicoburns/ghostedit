(function () {
	var _ui = {
		aelem: false,
		context: null
	},
	ghostedit = window.ghostedit;
	
	_ui.el = {};
	
	_ui.enable =  function () {
		
		// Call UI replace event to signal to other UI's to disable themselves (at their own discretion)
		ghostedit.event.trigger("ui:replace");
				
		// Register event listeners
		ghostedit.event.addListener("ui:update", function () { _ui.update(); }, "minimalui");
		ghostedit.event.addListener ("ui:replace", function () { ghostedit.api.plugin.disable("minimalui"); }, "minimalui");
		
		// Define tempoary variables for UI creation
		var toolbar, plugins, i, linkplugin = false, listplugin = false;
		
		// Create toolbar wrapper
		toolbar = document.createElement("div");
		toolbar.id = "ghostedit_minimalui_toolbar";
		toolbar.className = "ghostedit_minimalui_toolbar";
		_ui.el.toolbar = toolbar;
		
		// Buttons	
		_ui.insertbutton({label: "Bold", icon: "format-bold.png", action: function () { ghostedit.api.format.bold(); }});
		_ui.insertbutton({label: "Italic", icon: "format-italic.png", action: function () { ghostedit.api.format.italic(); }});
		_ui.insertbutton({label: "Underline", icon: "format-underline.png", action: function () { ghostedit.api.format.underline(); }});
		_ui.insertbutton({label: "Strikethrough", icon: "format-strikethrough.png", action: function () { ghostedit.api.format.strikethrough(); }});
		_ui.insertbutton({label: "Align Left", icon: "align-left.png", action: function () { ghostedit.api.format.alignText("left"); }});
		_ui.insertbutton({label: "Align Center", icon: "align-center.png", action: function () { ghostedit.api.format.alignText("center"); }});
		_ui.insertbutton({label: "Align Right", icon: "align-right.png", action: function () { ghostedit.api.format.alignText("right"); }});
		_ui.insertbutton({label: "Justify", icon: "align-justified.png", action: function () { ghostedit.api.format.alignText("justify"); }});
		
		plugins = ghostedit.options.plugins;
		if (plugins) {
			for (i = 0; i < plugins.length; i++) {
				switch (plugins[i]) {
					case "link":
						linkplugin = true;
					break;
					case "list":
						listplugin = true;
					break;
				}
			}
		}
		
		if (linkplugin) {
			_ui.insertbutton({label: "Insert Link", icon: "insert-link.png", action: function () { ghostedit.api.link.create(); }});
		}
		
		if (listplugin) {
			_ui.insertbutton({label: "Bulleted List", icon: "list-unordered.png", action: function () { ghostedit.api.list.toggle("unordered"); }});
			_ui.insertbutton({label: "Numbered List", icon: "list-ordered.png", action: function () { ghostedit.api.list.toggle("ordered"); }});
		}

		_ui.insertbutton({label: "Undo", icon: "undo16.png", action: function() { ghostedit.api.undo(); } });
		_ui.insertbutton({label: "Redo", icon: "redo16.png", action: function() { ghostedit.api.redo(); } });
		
		// Insert toolbar into DOM
		ghostedit.el.uilayer.parentNode.insertBefore(toolbar, ghostedit.el.uilayer);
		
		// Attach event handlers to toolbar
		ghostedit.util.addEvent(_ui.el.toolbar,"mouseup", ghostedit.util.cancelAllEvents);
		ghostedit.util.addEvent(_ui.el.toolbar, "click", ghostedit.util.preventBubble);
		ghostedit.util.addEvent(_ui.el.toolbar, "mousedown", ghostedit.util.preventBubble);
	};
	
	_ui.disable = function () {
		// Remove event listeners
		ghostedit.event.removeAllListeners("minimalui");
		
		// Remove toolbar
		_ui.el.toolbar.parentNode.removeChild(_ui.el.toolbar);
	};
	
	_ui.update = function () {
		var i, j, node, tagname, classname, ht;
		ht = _ui.highlightmap;
		
		/* Reset ui elements to non highlighted state */
		for (i = 0; i < ht.length; i++) {
			ghostedit.util.removeClass(ht[i].element, "current");
		}
	
		for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
			node = ghostedit.selection.nodepath[i];
			tagname = node.tagName.toLowerCase();
			classname = ghostedit.util.trim(node.className);
			
			for (j = 0; j < ht.length; j++) {
				if (ht[j].test.call(ht[j].data, tagname, classname, node)) {
					ghostedit.util.addClass(ht[j].element, "current");
				}
			}			
		}
	};
	
	_ui.quickbuttons = [];
	_ui.highlightmap = [];
	
	_ui.insertbutton = function (def /* {type, label, icon, action, style, highlighttag, highlightclass} */) {
		var button;
		if (!def || !def.label || !def.icon || !ghostedit.util.isFunction(def.action)) return false;
		
		
		button = document.createElement("img");
		button.src = ghostedit.options.imageurl + "/minimalui/" + def.icon;
		button.title = def.label;
		button.alt = def.label;
		if (def.style) button.style.cssText = def.style;
		button.style.marginRight = "5px";
		
		_ui.el.toolbar.appendChild(button);
		if (def.highlighttest) {
			_ui.highlightmap.push({element: button, test: def.highlighttest});
		}
		
		ghostedit.util.addEvent(button, "click", def.action);
	};

	_ui.inserttextfield = function (panelgroup, def) {
		var input;
		
		input = document.createElement("input");
		if(def.id) input.id = "ghostedit_minimalui_textfield_" + def.id;
		input.style.width = def.width ? def.width : "200px";
		
		if (def.label) panelgroup.innerHTML += def.label + "<br />";
		panelgroup.appendChild(input);
		
		ghostedit.util.addEvent(input, "click", function (event) { ghostedit.util.preventBubble(event); });
		ghostedit.util.addEvent(input, "keypress", function (event) { ghostedit.util.preventBubble(event); });
		ghostedit.util.addEvent(input, "keydown", function (event) { ghostedit.util.preventBubble(event); });
		ghostedit.util.addEvent(input, "keyup", def.onkeyup);
	};
			
	_ui.insertstylebox = function (panelgroup, def /* {type, label, tagname, classnanme} */) {
		var stylebox;
		
		_ui.highlightmap.push({
		element: stylebox,
		data: { tagname: def.tagname, classname: def.classname !== undefined ? def.classname : ""},
			test: function (tagname, classname/*, node*/) { return tagname === this.tagname && classname === this.classname; }
		});
		
		stylebox.onclick = function () { ghostedit.api.format.setStyle(def.tagname, def.classname); };
	};
	
	ghostedit.api.plugin.register("minimalui", _ui);
})();