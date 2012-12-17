(function () {
	var _ui = {
		aelem: false,
		context: null,
		elemInEnglish: { "h1": "Heading 1", "h2": "Heading 2", "h3": "Heading 3", "p": "Paragraph", "div": "Generic Box", "a": "Link", "b": "Bold", "strong": "Bold", "i": "Italic", "em": "Italic",
					"u": "Underline", "img": "Image", "ul": "Bulletted list", "ol": "Numbered list", "li": "List Item", "strike": "Strikethrough"},
		definition: {
			quickbuttons: [
				{label: "Save", icon: "save16.png", action: function() { ghostedit.api.save(); } },
				{label: "Undo", icon: "undo16.png", action: function() { ghostedit.api.undo(); } },
				{label: "Redo", icon: "redo16.png", action: function() { ghostedit.api.redo(); } }
			],
			tabs: [
				{name: "textblock", label: "Format", enabled: true,
					contents: [
					{type: "group", style: "padding-top: 3px", contents: [
						{type: "button", id: "bold", label: "Bold", icon: "format-bold.png",
							highlighttest: function (t) {return t === "b" || t === "strong";},
							action: function () { ghostedit.api.format.bold(); }},
						{type: "button", id: "italic", label: "Italic", icon: "format-italic.png",
								highlighttest: function (t) {return t === "i" || t === "em";},
								action: function () { ghostedit.api.format.italic(); }},
						{type: "button", id: "underline", label: "Underline", icon: "format-underline.png", 
								highlighttest: function (t) {return t === "u";},
								action: function () { ghostedit.api.format.underline(); }},
						{type: "button", id: "strikethrough", label: "Strikethrough", icon: "format-strikethrough.png",
								highlighttest: function (t) {return t === "strike";},
								action: function () { ghostedit.api.format.strikethrough(); }},
						{type: "br"},
						{type: "button", id: "align-left", label: "Align Left", icon: "align-left.png",
								highlighttest: function (t, c, n) {return n.style.textAlign === "left" || n.style.textAlign === "";},
								action: function () { ghostedit.api.format.alignText("left"); }},
						{type: "button", id: "align-center", label: "Align Center", icon: "align-center.png", 
								highlighttest: function (t, c, n) {return n.style.textAlign === "center";},
								action: function () { ghostedit.api.format.alignText("center"); }},
						{type: "button", id: "align-right", label: "Align Right", icon: "align-right.png", 
								highlighttest: function (t, c, n) {return n.style.textAlign === "right";},
								action: function () { ghostedit.api.format.alignText("right"); }},
						{type: "button", id: "align-justify", label: "Justify", icon: "align-justified.png", 
								highlighttest: function (t, c, n) {return n.style.textAlign === "justify";},
								action: function () { ghostedit.api.format.alignText("justify"); }}
					]},
					{type: "seperator"},
					{type: "group", style: "padding-top: 3px", contents: [
						{type: "button", id: "list-unordered", label: "Bulleted List", icon: "list-unordered.png",
							action: function () { ghostedit.api.list.toggle("unordered"); }},
						{type: "button", id: "list-ordered", label: "Numbered List", icon: "list-ordered.png",
							action: function () { ghostedit.api.list.toggle("ordered"); }}
					]},
					{type: "seperator"},
					{type: "group", contents: [
						{type: "stylebox", label: "Paragraph", tagname: "p"},
						{type: "stylebox", label: "LeadPara", tagname: "p", classname: "LeadingParagraph"},
						{type: "stylebox", label: "Heading 1", tagname: "h1"},
						{type: "stylebox", label: "Heading 2", tagname: "h2"},
						{type: "stylebox", label: "Heading 3", tagname: "h3"}
					]}
					]},
				{name: "insert", label: "Insert", enabled: true,
					contents: [
					{type: "group", style: "padding-top: 3px", contents: [
						{type: "button", id: "insert-link", label: "Insert Link", icon: "insert-link.png",
							action: function () { _ui.toolbar.event.buttonclick.insertlink(); }},
						{type: "button", id: "insert-image", label: "Insert Image", icon: "insert-image.png",
								action: function () { _ui.toolbar.event.buttonclick.insertimage(); }}
					]},
					{type: "seperator"},
					{type: "group", contents: [
						{type: "specialchar", character: "&#224;"},
						{type: "specialchar", character: "&#225;"},
						{type: "specialchar", character: "&#226;"},
						{type: "specialchar", character: "&#227;"},
						{type: "specialchar", character: "&#228;"},
						{type: "specialchar", character: "&#229;"},
						//e letters -->
						{type: "specialchar", character: "&#232;"},
						{type: "specialchar", character: "&#233;"},
						{type: "br"},
						{type: "specialchar", character: "&#234;"},
						{type: "specialchar", character: "&#235;"},
						//i letters -->
						{type: "specialchar", character: "&#236;"},
						{type: "specialchar", character: "&#237;"},
						{type: "specialchar", character: "&#238;"},
						{type: "specialchar", character: "&#239;"},
						//o letters -->
						{type: "specialchar", character: "&#242;"},
						{type: "specialchar", character: "&#243;"},
						{type: "br"},
						{type: "specialchar", character: "&#244;"},
						{type: "specialchar", character: "&#245;"},
						{type: "specialchar", character: "&#246;"},
						//u letters -->
						{type: "specialchar", character: "&#249;"},
						{type: "specialchar", character: "&#250;"},
						{type: "specialchar", character: "&#251;"},
						{type: "specialchar", character: "&#252;"}
					]},
					{type: "seperator"},
					{type: "group", contents: [
						{type: "specialchar", character: "+"},
						{type: "specialchar", character: "&#8722;"},
						{type: "specialchar", character: "&#215;"},
						{type: "specialchar", character: "&#247;"},
						{type: "br"},
						{type: "specialchar", character: "&#8804;"},
						{type: "specialchar", character: "&#8805;"},
						{type: "specialchar", character: "&#177;"},
						{type: "specialchar", character: "&#8801;"},
						{type: "br"},
						{type: "specialchar", character: "&#189;"},
						{type: "specialchar", character: "&#188;"},
						{type: "specialchar", character: "&#190;"},
						{type: "specialchar", character: "&#960;"}
					]}
					]},
				{name: "save", label: "Save", enabled: true,
					contents: [
					{type: "group", contents: [
						{type: "textfield", label: "Page Name",
							onkeyup: function () { ghostedit.plugins.save.updateparameter("name", this.value); } }
					]},
					{type: "group", contents: [
						{type: "textfield", label: "Page Url Slug",
							onkeyup: function () { ghostedit.plugins.save.updateparameter("url", this.value); } }
					]},
					{type: "group", contents: [
						{type: "button", id: "save", label: "Save", icon: "save.png",
								action: function () { ghostedit.api.save(); }}
					]},
					{type: "seperator"},
					{type: "group", contents: [
						{type: "button", id: "about", label: "About GhostEdit & credits", icon: "about.png",
								action: function () { ghostedit.api.defaultui.showabout(); }}
					]}
					]},
				{name: "link", label: "Link", enabled: false,
					contents: [
					{type: "group", contents: [
						{type: "textfield", id: "linkurl", label: "Link URL", width: "400px",
							onkeyup: function () { ghostedit.api.link.updateurl(this.value); } }
					]},
					{type: "group", contents: [
						{type: "button", label: "Open link in new tab", icon: "openlink.png",
							action: function () { ghostedit.api.link.open(); }}
					]}
					]},
				{name: "image", label: "Image", enabled: false,
					contents: [
					{type: "group", contents: [
						{type: "textfield", id: "imagealt", label: "Description / Alt text",
							onkeyup: function () { ghostedit.api.image.updatealttext(this.value); } }
					]}
					]}
			]
		}
	},
	ghostedit = window.ghostedit;
	
	_ui.el = {};
	
	_ui.enable =  function () {
		
		// Call UI replace event to signal to other UI's to disable themselves (at their own discretion)
		ghostedit.event.trigger("ui:replace");
				
		// Register event listeners
		ghostedit.event.addListener("ui:update", function () { _ui.update(); }, "defaultui");
		ghostedit.event.addListener("ui:message", function (params) { _ui.message.show(params); }, "defaultui");
		ghostedit.event.addListener ("ui:replace", function () { ghostedit.api.plugin.disable("defaultui"); }, "defaultui");
		
		ghostedit.event.addListener ("selection:change", function () {
			var node;
			for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
				node = ghostedit.selection.nodepath[i];
				if(node.tagName && node.tagName.toLowerCase() === "img") {
					if(ghostedit.selection.saved.type === "image") {
						document.getElementById('ghostedit_defaultui_textfield_imagealt').value = ghostedit.selection.saved.data.alt;
					}
					ghostedit.event.trigger("ui:newcontext", {context: "image"});
					break;
				}
				if(node.tagName && node.tagName.toLowerCase() === "a") {
					if(ghostedit.plugins.link.focusedlink) {
						document.getElementById('ghostedit_defaultui_textfield_linkurl').value = (ghostedit.plugins.link.focusedlink.href === "http:") ? "http://" : ghostedit.plugins.link.focusedlink.href;
					}
					
					ghostedit.event.trigger("ui:newcontext", {context: "link"});
					break;
				}				
				if(ghostedit.plugins.textblock.isTextBlock(node)) {
					ghostedit.event.trigger("ui:newcontext", {context: "textblock"});
					break;
				}
			}
		}, "defaultui");
		
		ghostedit.event.addListener ("ui:newcontext", function (params) {
			if (!params.context) return;
			if (_ui.context && !/textblock|format|insert|save/.test(_ui.context)) {
				_ui.toolbar.disabletab(_ui.context);
			}
			
			if (typeof params.context === "string") params.context = params.context.replace("textblock", "textblock");
			_ui.context = params.context;
			
			if(params.context === "image" && ghostedit.selection.type === "image") {
				var img = ghostedit.selection.data;
				document.getElementById("ghostedit_toolbar_imagealttext").value = img.alt;
				//document.getElementById("ghostedit_toolbar_imagesrc").value = img.src;
			}
			
			if (_ui.context && !/image|help|save/.test(_ui.context)) {
				ghostedit.plugins.image.unfocus();
			}	
			
			_ui.toolbar.showtab(params.context);
		}, "defaultui");
		
		// Set default options
		if (!ghostedit.options.defaultui) ghostedit.options.defaultui = {};
		if (!ghostedit.options.defaultui.statusbar) ghostedit.options.defaultui.statusbar = true;
		if (!ghostedit.options.defaultui.wordcount) ghostedit.options.defaultui.wordcount = true;
		
		// Define tempoary variables for UI creation
		var def, toolbar, qbanchor, tabselect, messagearea, statusbar,  i, modal, modalbg;
		def = _ui.definition;
		
		// Create toolbar wrapper
		toolbar = document.createElement("div");
		toolbar.id = "ghostedit_defaultui_toolbar";
		toolbar.className = "ghostedit_defaultui_toolbar";
		_ui.el.toolbar = toolbar;
		
		// Create and insert message area
		messagearea = document.createElement("div");
		messagearea.id = "ghostedit_defaultui_messagearea";
		messagearea.className = "ghostedit_defaultui_messagearea";
		messagearea.innerHTML = "&nbsp;";
		
		toolbar.appendChild(messagearea);
		_ui.el.messagearea = messagearea;
		
		// Quickbuttons
		qbanchor = document.createElement("div");
		qbanchor.id = "ghostedit_defaultui_quickbutton_insertanchor";
		qbanchor.style.cssText = "float: left; position: relative; width: 3px;height: 16px";
		toolbar.insertBefore(qbanchor, messagearea);
		_ui.el.qbanchor = qbanchor;
		
		if (def.quickbuttons) {
			for (i = 0; i < def.quickbuttons.length; i++) {
				_ui.toolbar.insert.quickbutton ( def.quickbuttons[i] );
			}
		}
		
		// Tabs
		tabselect = qbanchor = document.createElement("div");
		tabselect.id = "ghostedit_defaultui_tabselect";
		tabselect.style.cssText = "position: absolute;width: 100%;left: 0; bottom: -1px; height: 1px; line-height: 1px; font-size: 1px; background-color: #FFF";
		_ui.el.tabselect = tabselect;
		
		if (def.tabs) {
			for (i = 0; i < def.tabs.length; i++) {
				_ui.toolbar.insert.tab ( def.tabs[i] );
			}
		}
		
		// Insert toolbar into DOM
		ghostedit.wrapdiv.insertBefore(toolbar, ghostedit.wrapdiv.firstChild);
		
		// Attach event handlers to toolbar
		ghostedit.util.addEvent(_ui.el.toolbar,"mouseup", function(event) {_ui.toolbar.event.click(event); });
		ghostedit.util.addEvent(_ui.el.toolbar, "click", function( e ) { ghostedit.util.preventBubble(e); } );
		ghostedit.util.addEvent(_ui.el.toolbar, "mousedown", function( e ) { ghostedit.util.preventBubble(e); } );
		
		// Create and insert status bar
		statusbar = document.createElement("div");
		statusbar.id = "ghostedit_defaultui_statusbar";
		statusbar.className = "ghostedit_defaultui_statusbar";
		statusbar.innerHTML = "<b>Path:</b>";
		ghostedit.wrapdiv.appendChild(statusbar);
		_ui.el.statusbar = statusbar;
		
		// Create (initially hidden) modal elements
		modal = document.createElement("div");
		modal.id = "ghostedit_defaultui_modal";
		modal.className = "ghostedit_defaultui_modal";
		ghostedit.wrapdiv.appendChild(modal);
		_ui.el.modal = modal;
		
		modalbg = document.createElement("div");
		modalbg.id = "ghostedit_defaultui_modalbg";
		modalbg.className = "ghostedit_defaultui_modalbg";
		ghostedit.util.addEvent(modalbg, "click", function () { _ui.modal.hide(); });
		ghostedit.wrapdiv.appendChild(modalbg);
		_ui.el.modalbg = modalbg;
		
		// Show textblock tab
		_ui.toolbar.showtab("textblock");
	};
	
	_ui.disable = function () {
		// Remove event listeners
		ghostedit.event.removeAllListeners("defaultui");
		
		// Remove toolbar
		ghostedit.wrapdiv.removeChild(_ui.el.toolbar);
		
		// Remove statusbar
		ghostedit.wrapdiv.removeChild(_ui.el.statusbar);
		
		// Remove modal elements
		ghostedit.wrapdiv.removeChild(_ui.el.modal);
		ghostedit.wrapdiv.removeChild(_ui.el.modalbg);
		
		// Reset ui element tracking arrays
		_ui.toolbar.quickbuttons = [];
		_ui.toolbar.tabs = [];
		_ui.toolbar.enabledtabs = [];
		_ui.toolbar.panels = [];
	};
	
	_ui.update = function () {
		var i, j, node, tagname, classname, pathstring = "", wordcount = "N/A", textcontent, ht;
		ht = _ui.toolbar.highlightmap;
		
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


			/*if (ghostedit.plugins.textblock.isTextBlock(node) && _ui.typeChangerLookup[node.tagName]) {
				ghostedit.util.addClass(document.getElementById(_ui.typeChangerLookup[node.tagName]), "ghostedit_defaultui_stylebox_current")
				document.getElementById('ghostedit_defaultui_clearselect').value = node.style.clear;
				document.getElementById("align" + (node.style.textAlign != "" ? node.style.textAlign : "left") + "Button").className = "current";
			}*/
			
			if (i !== ghostedit.selection.nodepath.length - 1) { // Don't include editdiv in path
				pathstring = " > " + (_ui.elemInEnglish[node.tagName.toLowerCase()] || node.tagName.toUpperCase()) + pathstring;
			}
			
		}
		
		_ui.el.statusbar.innerHTML = "<b>Path</b>" + pathstring;
		
		if (ghostedit.options.defaultui.wordcount) {
			textcontent = ghostedit.util.trim(ghostedit.editdiv.innerText || ghostedit.editdiv.textContent);
			wordcount = textcontent.split(/\s+/).length;
			_ui.el.statusbar.innerHTML += "<div style='position: absolute; right: 10px; top: 3px'>" + wordcount + " words</div>";	
		}
	};
	
		
	_ui.modal = {
		show: function (content) {
			var modal, modalbg, a;
			modal = _ui.el.modal;
			modalbg = _ui.el.modalbg;
			
			modal.innerHTML = content;
			
			a = document.createElement("a");
			a.className = "ghostedit_defaultui_modal_closebutton";
			a.innerHTML = "&#215";
			ghostedit.util.addEvent(a, "click", _ui.modal.hide);
			modal.appendChild(a);
			
			modal.style.display = 'block';
			modalbg.style.display = 'block';
		},
		
		hide: function () {
			var modal, modalbg;
			modal = _ui.el.modal;
			modalbg = _ui.el.modalbg;
			
			modal.style.display = 'none';
			modalbg.style.display = 'none';
			modal.innerHTML = "";
			ghostedit.selection.restore();
		},
		
		showabout: function () {
			_ui.modal.show("<h2>About GhostEdit</h2>" +
			"<p>GhostEdit is a WYSIWYG editor based on the concept that the editor should be transparent to use - i.e. you do no notice that you are using it. This manifests itself in two ways:</p>" +
			"<ul><li>GhostEdit has an incredibly simple user interface, which is designed for maximum usability</li>" +
			"<li>GhostEdit restricts input to known, safe content so as to be as reliable as possible</li></ul>" + 
			"<h3>Credits</h3>" +
			"GhostEdit was designed and coded by <a href='http://nicoburns.com'>Nico Burns</a>.<br />" +
			"Icons licensed from <a href='http://www.gentleface.com/free_icon_set.html'>Gentleface</a> under a <a href='http://creativecommons.org/licenses/by-nc-nd/3.0/'>CC BY-NC-ND 3.0</a> liscense." + 
			"<br />version: " + ghostedit.version);
			
		}
	};
	
	_ui.message = {
		div: "",
		show: function (params) {//, bgcolor) {
			var msg, time, color, msgarea;
			msg = params.message;
			time = params.time;
			color = params.color;
			
			msgarea = _ui.el.messagearea;
			msgarea.innerHTML = msg;

			color = (color === "success") ? "#bbff00" : color;
			color = (color === "error") ? "#ff4949" : color;
			color = (color === "warn") ? "#ffef49" : color;
			msgarea.style.backgroundColor = color;
			
			msgarea.style.opacity = 1;
			if (msgarea.filters){ msgarea.filters.item(0).enabled = 1; }
			
			if (time !== 0) {
				clearTimeout(_ui.message.timer);
				_ui.message.timer = setTimeout(function() { _ui.message.clear(); }, time * 1000);
			}
		},
		
		clear: function () {
			var msgarea = _ui.el.messagearea;
			if (msgarea.style.opacity > 0.1) {
				msgarea.style.opacity = msgarea.style.opacity - 0.05;
				if (msgarea.filters){ msgarea.filters.item(0).Opacity = (msgarea.style.opacity*100); }
				setTimeout(function() { _ui.message.clear(); }, 20);
			}
			else {
				msgarea.innerHTML = "&nbsp;";
				msgarea.style.backgroundColor = "transparent";
				msgarea.opacity = "1";
				if (msgarea.filters) { msgarea.filters.item(0).Opacity = 100; }
			}
		}
	};
	
	_ui.toolbar = {
		div: "",
		quickbuttons: [],
		tabs: [],
		enabledtabs: ["format", "insert", "save"],
		panels: [],
		styleboxes: [],
		highlightmap: [],
		
		event: {
			click: function (e) {
				if (!ghostedit.event.allowtoolbarclick ) {//}&& !ghostedit.image.focusedimage) {
					//Causes toolbar text field not to be selectable.ghostedit.selection.restore();
					ghostedit.util.cancelAllEvents (e);
				}
			},
			
			buttonclick: {
				insertimage: function () {
					ghostedit.selection.save();
					var i, elem, images, modalcontent, insert;
					modalcontent = "<h2>Insert image</h2><form>" +
					"<p>This dialog allows you to choose an image to insert into the document. Either select one from the list of uploaded images, or enter a custom url in the box below.</p>" +
					"<hr />" +
					//"<h3 style='clear: both;'>Upload new image</h3>" +
					//"<div id='ghostedit_imageuploadarea'><noscript>noscript</noscript></div>" +
					//"<hr />" +
					"<h3 style='clear: both;'>Select uploaded image</h3>" +
					"<div id='ghostedit_listbox' style='height: 200px;overflow-x: hidden;overflow-y: scroll;background: white; border: 1px solid #ccc'></div>" +
					"<hr />" +
					"<h3>Or enter URL</h3>" +
					"<input type='text' value='' id='ghostedit_imageurlinput' style='width: 99%' /><br />" +
					"<input type='button' value='Insert' style='float: right;margin-top: 10px;' onclick='ghostedit.plugins.image.newImageBefore(null, null);ghostedit.plugins.defaultui.modal.hide();' />" +
					"</form>" +
					"";
					
					/*images = [
					{id: "5", name: "test3", url: "data/pages/images/large/5.jpg", thumburl: ""},
					{id: "6", name: "test2", url: "data/pages/images/large/6.jpg", thumburl: "data/pages/images/small/6.jpg"}
					];*/
					
					images = [];
					
					if(ghostedit.options.defaultui.uploadedimages) {
						images = ghostedit.options.defaultui.uploadedimages;
					}
					
					_ui.modal.show(modalcontent);
					
					insert = function () {
						ghostedit.plugins.image.newImageBefore(null, this.getAttribute("ghostedit-listitem-value"), false);
						_ui.modal.hide();
					};
					
					for(i = 0; i < images.length; i += 1) {
						elem = document.createElement("div");
						elem.className = "ghostedit-listbox-item";
						elem.setAttribute("ghostedit-listitem-value", images[i].url);
						elem.innerHTML = "<img src='" + images[i].thumburl + "' style='height: 60px; float: left' /><p style='margin-left: 100px;font-size: 21px'>" + images[i].name + "</p>";
						elem.onclick = insert;
						document.getElementById("ghostedit_listbox").appendChild(elem);
					}
					
					document.getElementById('ghostedit_imageurlinput').focus();
				},
				
				insertlink: function () {
					ghostedit.api.link.create();
					document.getElementById('ghostedit_defaultui_textfield_linkurl').focus();
				}
			}
		},
		
		clicktab: function (tab) {
			var panel, tabname;
			if (typeof tab === "string") tab = document.getElementById('ghostedit_defaultui_toolbartab_' + tab.replace('ghostedit_defaultui_toolbartab_',''));
			tabname = tab.id.replace('ghostedit_defaultui_toolbartab_','');
			panel = document.getElementById('ghostedit_defaultui_toolbarpanel_' + tabname);
		
			ghostedit.selection.restore();
			
			ghostedit.event.trigger("ui:newcontext", {context: tabname});
			//_ui.toolbar.showtab(tab);
		},
		
		showtab: function (tab) {
			var panel, tabname, toolbarelems, i, node;
			if (typeof tab === "string") tab = document.getElementById('ghostedit_defaultui_toolbartab_' + tab.replace('ghostedit_defaultui_toolbartab_',''));
			tabname = tab.id.replace('ghostedit_defaultui_toolbartab_','');
			panel = document.getElementById('ghostedit_defaultui_toolbarpanel_' + tabname);
			
			toolbarelems = _ui.el.toolbar.childNodes;
			
			for (i = 0; i < toolbarelems.length; i += 1) {
				node = toolbarelems[i];
				if (node.nodeType === 1) {
					if (/tab/.test(node.className) || /panel/.test(node.className)) {
						ghostedit.util.removeClass(node, "active");
					}
				}
			}
			
			if (!_ui.toolbar.enabledtabs[tabname]) _ui.toolbar.enabletab (tabname);
			ghostedit.util.addClass(tab, "active");
			ghostedit.util.addClass(panel, "active");
			//moves the elem which appears over border-bottom of active tab
			tab.appendChild(_ui.el.tabselect);
		},
		
		enabletab: function (tabname) {
			var tab;
			tab = document.getElementById('ghostedit_defaultui_toolbartab_' + tabname);
			//panel = document.getElementById('ghostedit_defaultui_toolbarpanel_' + tabname);
			
			ghostedit.util.addClass(tab, "enabled");
			_ui.toolbar.enabledtabs.push(tabname);
		},
		
		disabletab: function (tabname) {
			var tab;
			
			tab = document.getElementById('ghostedit_defaultui_toolbartab_' + tabname);
			//panel = document.getElementById('ghostedit_defaultui_toolbarpanel_' + tabname);
			
			ghostedit.util.removeClass(tab, "enabled");
			delete _ui.toolbar.enabledtabs[tabname];
		},
		
		insert: {
			quickbutton: function (def /* {label, icon, action} */) {
				var button;
				if (!def || !def.label || !def.icon || !ghostedit.util.isFunction(def.action)) return false;
				
				button = document.createElement("img");
				button.className = "ghostedit_defaultui_quickbutton";
				button.src = ghostedit.options.imageurl + "/defaultui/" + def.icon;
				button.title = def.label;
				button.alt = def.label;
				
				_ui.el.toolbar.insertBefore(button, _ui.el.qbanchor);
				_ui.toolbar.quickbuttons.push(button);
				
				button.onclick = def.action;
			},
			
			tab: function (def /* {name, label, enabled, contents */) {
				var tab, panel, i;
				
				// Create tab
				tab = document.createElement("div");
				tab.className = def.enabled ? "ghostedit_defaultui_toolbartab enabled" : "ghostedit_defaultui_toolbartab";
				tab.id = "ghostedit_defaultui_toolbartab_" + def.name;
				tab.innerHTML = def.label;
				
				// Create panel
				panel = document.createElement("div");
				ghostedit.util.addClass(panel, "ghostedit_defaultui_toolbarpanel");
				panel.id = "ghostedit_defaultui_toolbarpanel_" + def.name;
				
				// Create panel content
				if (def.contents) {
					for (i = 0; i < def.contents.length; i++) {
						switch (def.contents[i].type) {
							case "group":
								_ui.toolbar.insert.panelgroup (panel, def.contents[i]);
							break;
							case "seperator":
								_ui.toolbar.insert.panelseperator (panel);
							break;
						}
					}
				}
				
				// Insert tab and panel
				_ui.el.toolbar.insertBefore(tab, _ui.el.messagearea);
				_ui.el.toolbar.appendChild(panel);
				_ui.toolbar.tabs.push(tab);
				
				tab.onclick = function () { _ui.toolbar.clicktab(this); };
			},
			
			
			panelseperator: function (panel) {
				var seperator;
				
				seperator = document.createElement("span");
				seperator.className = "ghostedit_defaultui_toolbarseperator";
				seperator.style.backgroundImage = "URL(" + ghostedit.options.imageurl + "/defaultui/toolbar_seperator.png)";
				
				panel.appendChild(seperator);
			},
		
			panelgroup: function (panel, def /* {type, style, contents} */) {
				var group, i;
				
				// Create panel group
				group = document.createElement("span");
				group.className = "ghostedit_defaultui_toolbarpanelgroup";
				if (def.style) group.style.cssTet = def.style;
				
				// Create group content
				if (def.contents) {
					for (i = 0; i < def.contents.length; i++) {
						switch (def.contents[i].type) {
							case "button":
								_ui.toolbar.insert.button (group, def.contents[i]);
							break;
							case "stylebox":
								_ui.toolbar.insert.stylebox (group, def.contents[i]);
							break;
							case "specialchar":
								_ui.toolbar.insert.specialchar (group, def.contents[i]);
							break;
							case "textfield":
								_ui.toolbar.insert.textfield (group, def.contents[i]);
							break;
							case "br":
								group.appendChild(document.createElement("br"));
							break;
							/*case "html":
								group.innerHTML += def.contents[i].html;
							break;*/
						}
					}
				}
				
				// Insert panelgroup
				panel.appendChild(group);
			},
			
			button: function (panelgroup, def /* {type, label, icon, action, style, highlighttag, highlightclass} */) {
				var button;
				
				button = document.createElement("img");
				button.src = ghostedit.options.imageurl + "/defaultui/" + def.icon;
				button.title = def.label;
				button.alt = def.label;
				if (def.style) button.style.cssText = def.style;
				
				panelgroup.appendChild(button);
				if (def.highlighttest) {
					_ui.toolbar.highlightmap.push({element: button, test: def.highlighttest});
				}
				
				ghostedit.util.addEvent(button, "click", def.action);
			},
			
			specialchar: function (panelgroup, def /* character */) {
				var button;
				
				button = document.createElement("a");
				button.className = "ghostedit_defaultui_specialchar";
				button.title = "Insert Character";
				button.alt = "Insert Character";
				button.innerHTML = def.character;
				
				panelgroup.appendChild(button);
				
				button.onclick = function () { ghostedit.api.insert.character(this); };
			},
			
			textfield: function (panelgroup, def) {
				var input;
				
				input = document.createElement("input");
				if(def.id) input.id = "ghostedit_defaultui_textfield_" + def.id;
				input.style.width = def.width ? def.width : "200px";
				
				if (def.label) panelgroup.innerHTML += def.label + "<br />";
				panelgroup.appendChild(input);
				
				ghostedit.util.addEvent(input, "click", function (event) { ghostedit.util.preventBubble(event); });
				ghostedit.util.addEvent(input, "keypress", function (event) { ghostedit.util.preventBubble(event); });
				ghostedit.util.addEvent(input, "keydown", function (event) { ghostedit.util.preventBubble(event); });
				ghostedit.util.addEvent(input, "keyup", def.onkeyup);
			},
			
			stylebox: function (panelgroup, def /* {type, label, tagname, classnanme} */) {
				var stylebox, label;
				
				stylebox = document.createElement("div");
				stylebox.className = "ghostedit_defaultui_stylebox";
				stylebox.id = "ghostedit_defaultui_stylebox_" + def.tagname;
				if (def.classname) stylebox.id = stylebox.id + "_" + def.classname;
				stylebox.innerHTML = "<" + def.tagname + " class='ghostedit_defaultui_stylebox_preview'>AaBbCc</" + def.tagname + ">";
				stylebox.title = def.label;
				stylebox.alt = def.label;
				
				label = document.createElement("div");
				label.className = "ghostedit_defaultui_stylebox_label";
				label.innerHTML = def.label;
				stylebox.appendChild(label);				
				
				panelgroup.appendChild(stylebox);
				_ui.toolbar.styleboxes.push(stylebox);
				
				_ui.toolbar.highlightmap.push({
					element: stylebox,
					data: { tagname: def.tagname, classname: def.classname !== undefined ? def.classname : ""},
					test: function (tagname, classname/*, node*/) { return tagname === this.tagname && classname === this.classname; }
				});
				
				stylebox.onclick = function () { ghostedit.api.format.setStyle(def.tagname, def.classname); };
			}	
		}
	};
	
	ghostedit.api.plugin.register("defaultui", _ui);
})();