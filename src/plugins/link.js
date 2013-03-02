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
			var result;
			
			// Save undo state
			ghostedit.history.saveUndoState();
			
			// Run link creation function
			result = _link.create();
			
			// Save undo state
			ghostedit.history.saveUndoState();
			
			return result;
		};
		
		ghostedit.api.link.updateurl = function (url) {
			return _link.updateurl(url);
		};
		
		ghostedit.api.link.open = function () {
			return _link.open();
		};
	};
		
	_link.event = {		
		postimport: function (params) {
			var i, aelems;
			if (!params || !params.rootnode) return false;
			
			aelems = params.rootnode.getElementsByTagName("a");
			for (i = 0; i < aelems.length; i += 1) {
				aelems[i].setAttribute("data-ghostedit-elemtype","link");
				aelems[i].setAttribute("data-ghostedit-handler","link");
			}
			return true;
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
			linkbox.style.cssText = "position: absolute;text-align: center;font-family: Tahoma, Geneva, sans-serif;" + 
				"cursor: pointer;font-size: 13px;border: 1px solid #FF028D;background-color: #FF028D;padding: 3px;" + 
				"z-index: 100;width: 92px";
			linkbox.id = "ghostedit_focusedlinkbox";				
			
			// Set position of 'remove link' box
			linkbox.style.top = (link.offsetTop + link.offsetHeight - 1) + "px";
			left = link.getClientRects()[link.getClientRects().length - 1].left;
			linkbox.style.left = (left - ghostedit.el.rootnode.getBoundingClientRect().left) + "px";
			
			// Create clickable link element, and add it to the 'remove link' box
			linkboxa = document.createElement("a");
			linkboxa.style.cursor = "pointer";
			linkboxa.style.color = "#000";
			linkboxa.innerHTML = "<b>&#215;</b>&nbsp;remove&nbsp;link</a>";
			linkbox.appendChild(linkboxa);
			
			// Insert 'remove link' box into DOM
			ghostedit.el.uilayer.appendChild(linkbox);
			
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
			ghostedit.el.uilayer.removeChild(_link.el.focusedbox);
			
			_link.el.focusedbox = null;
			_link.el.focusedboxa = null;
		}
	};
	
	_link.create = function (url) {
		var range, sel, newlink;
		if (typeof url === "undefined") url = "http://";
		
		// If selection is not a range, return
		sel = ghostedit.selection.saved;
		if (sel.type !== "textblock") return false;
		
		// If selection is collapsed, extend it to the current word
		if (sel.data.isCollapsed()) {
			range = sel.data.clone();
			range = ghostedit.plugins.textblock.selection.extendtoword(range, true);
			range.select();
			ghostedit.selection.save();
		}
		
		// If selection is still collapsed, insert a link with text "Link Text"
		if (sel.data.isCollapsed()) {
			// Create new link element
			newlink = document.createElement("a");
			newlink.id = "ghostedit_link_newlink";
			newlink.innerHTML = "Link Text";
			
			// Set attributes
			newlink.href = 'http://';
			//newlink.setAttribute("data-ghostedit-elemtype", "link");
			//newlink.setAttribute("data-ghostedit-handler", "link");
			
			// Insert link into the document and select it
			sel.data.insertNode(newlink);
			sel.data.selectNodeContents("ghostedit_link_newlink").select();
			document.getElementById("ghostedit_link_newlink").id = "";
			
			ghostedit.selection.save();
			/*if (document.createRange) {
				//Create <a> element, range.insertNode()
				
			}
			else if (document.selection) {
				sel.data.getNative().pasteHTML("<a  href='http://'>Link Text</a>");
				lasso().selectNodeContents("ghostedit_newlink").select();
				
			}*/
			//ghostedit.selection.savedRange.pasteText("Link Text", false);
		}
		// If selection is not collapsed, create a link from the selection
		else {
			document.execCommand("CreateLink", false, url);
			
			lasso().setToSelection().collapseToEnd().select();
			ghostedit.selection.save();
			
			// Set the new link's attributes
			newlink = ghostedit.plugins.link.focusedlink;
			//newlink.setAttribute("data-ghostedit-elemtype", "link");
			//newlink.setAttribute("data-ghostedit-handler", "link");
			newlink.href = "http://";
		}
		
		ghostedit.selection.save();
		return true;
	};
	
	_link.focus = function (link) {
		// Set focusedlink variable to the link
		_link.focusedlink = link;
		
		// Show the 'remove link' box
		_link.ui.show(link);
	};
	
	_link.unfocus = function () {
		if (_link.focusedlink === false) return;
		
		_link.ui.hide();
		_link.focusedlink = false;
	};
	
	_link.remove = function (link) {
		var linkcontent;
		link = link || _link.focusedlink;
		
		if (!link.tagName || link.tagName.toLowerCase() !== "a") return false;
		//if (ghostedit.selection.saved.type !== "textblock") return false;
		
		/*var range = lasso().selectNode(link).select();
		ghostedit.plugins.textblock.format.useCommand("unlink");
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