(function (window, undefined) {
	
	var _link = {
		focusedlink: false,
		el: {}
	},
	lasso = window.lasso,
	ghostedit = window.ghostedit;
	
	
	_link.enable = function () {
		// Register event listeners
		ghostedit.event.addListener ("preundo", function () { _link.unfocus(); });
		ghostedit.event.addListener ("preredo", function () { _link.unfocus(); });
		//ghostedit.event.addListener ("export:before", function () { _link.unfocus() });
		
		ghostedit.event.addListener("import:after", function () { _link.event.postimport(); });
		ghostedit.event.addListener("ui:update", function () { _link.ui.update(); });
		
		// Register link import capabilities for the textblock module
		ghostedit.inout.registerimporthandler (ghostedit.plugins.textblock.inout.importHTML, "a");
		ghostedit.plugins.textblock.inout.parserules.tags.a = { "attributes": [ "href" ] };//, {name: "data-ghostedit-elemtype", value: "link"}, {name: "data-ghostedit-handler", value: "link"} ] };
		
		// Register api functions
		ghostedit.api.link = ghostedit.api.link || {};
		
		ghostedit.api.link.create = function () {
			return _link.create();
		};
		
		ghostedit.api.link.updateurl = function (url) {
			return _link.updateurl(url);
		};
		
		ghostedit.api.link.open = function () {
			return _link.open();
		};
	};
	
	_link.ghostevent = function (/*event, target, source, params*/) {
		return false;
	};
		
	_link.event = {
		// TODO move to defaultui
		urlBoxKeypress: function (e) {
			e = (window.event !== null) ? window.event : e;
			var keycode = e.keyCode !== null ? e.keyCode : e.charCode;
			
			// If enter key is pressed
			if (keycode === 13) {
				_link.create();
				ghostedit.ui.modal.hide();
				return false;
			}
			return true;
		},
		
		postimport: function (params) {
			var i, aelems;
			if (!params || !params.editdiv) return false;
			
			aelems = params.editdiv.getElementsByTagName("a");
			for (i = 0; i < aelems.length; i += 1) {
				aelems[i].setAttribute("data-ghostedit-elemtype","link");
				aelems[i].setAttribute("data-ghostedit-handler","link");
			}
			return true;
		},
		
		insertButtonClick: function () {
			var range;
			if (ghostedit.selection.savedRange.isCollapsed()) {
				range = ghostedit.selection.savedRange.clone();
				/*if (!document.createRange && document.selection) {
					range.getNative().pasteHTML("<span id='ghostedit_marker'>z</span>")
					range.selectNodeContents("ghostedit_marker");
				}*/
				range = ghostedit.textblock.selection.extendtoword(range, true);
				range.select();
				ghostedit.selection.save();
			}
			
			if (ghostedit.selection.savedRange.isCollapsed()) {
				/*var modalcontent = "<h3>Create link</h3><form>" + 
				"<label for='ghostedit_urlinput'>Url:</label><input type='text' value='http://' id='ghostedit_urlinput' onkeypress='return _link.event.urlBoxKeypress(event);'/><br />" +
				"<label for='ghostedit_linktextinput'>Text:</label><input type='text' id='ghostedit_linktextinput' onkeypress='return _link.event.urlBoxKeypress(event);'/>" +
				"<input type='button' value='Create' style='float: right;margin-top: 10px;' onclick='_link.create();ghostedit.ui.modal.hide();' />" +
				"</form>";
				ghostedit.ui.modal.show(modalcontent);
				document.getElementById('ghostedit_linktextinput').value = ghostedit.selection.savedRange.getText();
				document.getElementById('ghostedit_urlinput').focus();*/
				
				//TODO standards based link insert
				/*if (document.createRange) {
					//Create <a> element, range.insertNode()
				}
				else */if (document.selection) {
					//TODO selection is never collapsed
					ghostedit.selection.savedRange.getNative().pasteHTML("<a id='ghostedit_newlink' href='http://'>Link Text</a>");
					lasso().selectNodeContents("ghostedit_newlink").select();
					document.getElementById("ghostedit_newlink").id = "";
				}
				//ghostedit.selection.savedRange.pasteText("Link Text", false);
			}
			else {
				_link.create("http://");
				ghostedit.selection.save();
				//document.getElementById('ghostedit_toolbar_linkurl').select();
				
				/*if (document.getElementById("ghostedit_marker")) {
					lasso().selectNode("ghostedit_marker").deleteContents().select();
				}*/
				_link.focusedlink.href = "http://";
				ghostedit.ui.toolbar.enabletab("link");
				ghostedit.ui.toolbar.showtab("link");
				document.getElementById('ghostedit_toolbar_linkurl').focus();
				//document.getElementById('ghostedit_toolbar_linkurl').value = Document.getElementById('ghostedit_toolbar_linkurl').value;
				ghostedit.selection.save();
			}
		}
	};
	
	_link.selection = {
		deleteContents: function () {
			return false;
		}
	};
	
	_link.ui = {
		update: function () {
			var node, i, aelem = false;
			
			for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
				node = ghostedit.selection.nodepath[i];
				if (node.tagName.toLowerCase() === "a") {
					aelem = node;
				}
			}
			
			if (aelem) {
				if (aelem !== _link.focusedlink) {
					_link.focus(aelem);
				}
			}
			else if (_link.focusedlink) {
				_link.unfocus();
			}
		},
		
		show: function (link) {
			var linkbox, linkboxa, left;
			
			// Make sure that no other ui elements are showing
			_link.ui.hide();
			
			// Create 'remove link' box
			linkbox = document.createElement("span");
			linkbox.className = "ghostedit_focusedlinkbox";
			linkbox.id = "ghostedit_focusedlinkbox";				
			
			// Set position of 'remove link' box
			linkbox.style.top = (link.offsetTop + link.offsetHeight - 1) + "px";
			left = link.getClientRects()[link.getClientRects().length - 1].left;
			linkbox.style.left = (left - ghostedit.editdiv.getBoundingClientRect().left) + "px";
			
			// Create clickable link element, and add it to the 'remove link' box
			linkboxa = document.createElement("a");
			linkboxa.style.cursor = "pointer";
			linkboxa.style.color = "#333";
			linkboxa.innerHTML = "<b>&#215;</b>&nbsp;remove&nbsp;link</a>";
			linkbox.appendChild(linkboxa);
			
			// Insert 'remove link' box into DOM
			ghostedit.contextuallayer.appendChild(linkbox);
			
			// Add event listeners and other properties to 'remove link' box
			linkbox.style.MozUserSelect = 'none';
			linkbox.contentEditable = false;
			linkbox.unselectable = 'on';
			linkbox.onmousedown = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.ondragstart = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.ondraggesture = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.onclick = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.ondblclick = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.onresizestart = function (event) { return ghostedit.util.cancelEvent(event); };
			linkbox.oncontrolselect = function(event){return ghostedit.util.cancelAllEvents(event); };
			
			// Add event to remove the focused link to the clickable link element
			ghostedit.util.addEvent(linkboxa, "click", ghostedit.util.preparefunction(_link.remove, null, link));
			
			// Save references to the elements
			_link.el.focusedbox = linkbox;
			_link.el.focusedboxa = linkboxa;
		},
		
		hide: function () {
			if (!_link.el.focusedbox) return;
			ghostedit.contextuallayer.removeChild(_link.el.focusedbox);
			
			_link.el.focusedbox = null;
			_link.el.focusedboxa = null;
		}
	};
	
	_link.create = function (url) {
		ghostedit.history.saveUndoState();
		var i, aelems;

		if (typeof url === "undefined") url = "http://";
		document.execCommand("CreateLink", false, url);

		aelems = ghostedit.editdiv.getElementsByTagName("a");
		for (i = 0; i < aelems.length; i += 1) {
			aelems[i].setAttribute("data-ghostedit-elemtype","link");
			aelems[i].setAttribute("data-ghostedit-handler","link");
		}
		
		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_link.focus = function (link) {
		// Set focusedlink variable to the link
		_link.focusedlink = link;
		
		// Show the 'remove link' box
		_link.ui.show(link);
			
		ghostedit.event.trigger("ui:newcontext", {context: "link"});
	};
	
	_link.unfocus = function () {
		if (_link.focusedlink === false) return;
		
		_link.ui.hide();
		_link.focusedlink = false;
	};
	
	_link.remove = function (link) {
		var linkcontent;
		link = link || _link.focusedlink;
		
		if(!ghostedit.dom.isGhostBlock(link) || link.tagName.toLowerCase() !== "a") return false;
		if (ghostedit.selection.saved.type !== "textblock") return false;
		
		/*var range = lasso().selectNode(link).select();
		ghostedit.textblock.format.useCommand("unlink");
		range.collapseToEnd().select();
		_link.unfocus();*/
		
		ghostedit.selection.saved.data.saveToDOM();
		linkcontent = ghostedit.dom.extractContent(link);
		link.parentNode.insertBefore (linkcontent, link);
		link.parentNode.removeChild(link);
		
		ghostedit.selection.saved.data.restoreFromDOM().select();
		ghostedit.selection.save();
	};
	
	_link.updateurl = function (newurl) {
		if (_link.focusedlink !== false && _link.focusedlink.href !== newurl) {
			_link.focusedlink.href = newurl;
			_link.focusedlink.title = newurl;
			ghostedit.event.trigger("ui:message", {message:"URL updated to '" + newurl + "'", time: 2, color: "success"});
		}
	};
	
	_link.open = function () {
		if (_link.focusedlink !== false) {
			window.open(_link.focusedlink.href);
		}
	};
	
	ghostedit.api.plugin.register("link", _link);
})(window);