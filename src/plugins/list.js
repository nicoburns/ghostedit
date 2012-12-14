(function (window, undefined) {
	
	var _list = {
		elemid: 0,
		itemelemid: 0
	};
	
	_list.enable = function () {	
		// Register event listeners
		ghostedit.event.addListener("postpaste", function () {
			var i, uls, ols, lists, list;
			lists = [];
			
			uls = ghostedit.editdiv.getElementsByTagName("ul");
			for (i = 0; i < uls.length; i++) { lists.push(uls[i]); }
			ols = ghostedit.editdiv.getElementsByTagName("ol");
			for (i = 0; i < ols.length; i++) { lists.push(ols[i]); }
			
			for (i = 0; i < lists.length; i++) {
				list = lists[i];
				if (!list.parentNode) continue;
				_list.tidy(list);
			}
		});
		
		// Register import capability
		ghostedit.inout.registerimporthandler (_list.inout.importHTML, "ol", "ul", "li");
		
		// Export api functions
		ghostedit.api.list = ghostedit.api.list || {};
		
		ghostedit.api.list.toggle = function (listtype) {
			_list.toggle(listtype);
		};
	};
	
	_list.ghostevent = function (eventtype, target, sourcedirection, params) {
		var docall = false, blocktype, eventhandled = false, newtarget, result, elemtype;
		switch (eventtype) {
			case "delete":
				elemtype = target.getAttribute("data-ghostedit-elemtype");
				if (elemtype === "list") {
					if (sourcedirection === "ahead" || sourcedirection === "behind") {
						newtarget = (sourcedirection === "ahead") ? ghostedit.dom.getLastChildGhostBlock(target) : ghostedit.dom.getFirstChildGhostBlock(target);
						return _list.ghostevent("delete", newtarget, sourcedirection, params);
					}
					else return false;
				}
				else if (elemtype === "listitem") {
					//alert(target.id + sourcedirection);
					if (sourcedirection === "ahead" || sourcedirection === "behind") {
						newtarget = ghostedit.dom.getFirstChildGhostBlock(target);
						result = ghostedit.plugins.textblock.event.textdelete (newtarget, sourcedirection, params);
					}
					else if (sourcedirection === "top") {
						result = ghostedit.event.sendBackwards("delete", target, params);
					}
					else if (sourcedirection === "bottom") {
						result = ghostedit.event.sendForwards("delete", target, params);
					}
					//alert(target.id + sourcedirection + result);
					return result;
				}
			break;
			/*case "keydown":
				switch (params.keycode) {
					case 8: // backspace
						return ghostedit.plugins.textblock.event.backspace(target, params.event);
					break;
					case 46: //delete
						return ghostedit.plugins.textblock.event.deletekey (target, params.event);
					break;
				}
			break;
			case "keypress":
				switch (params.keycode) {
					case 13: // enter
						return ghostedit.plugins.textblock.event.enterkey (target, params.event);
					break;
				}
			break;*/
		}
		
	};
	
	_list.dom = {	
		addchild: function (target, wheretoinsert, sourceelem, newElem, params) {
			var parent, listitem, result = false, newelemisempty = false;
			
			if (params && params.contentlength !== false) {
				newelemisempty = (params.contentlength < 1) ? true : false;
			}
			
			// Get target list if listelem is targetted
			//DEV console.log("target 2:")
			//DEV console.log(target);
			if (target.getAttribute("data-ghostedit-elemtype") === "listitem") {
				target = ghostedit.dom.getParentGhostBlock (target);
			}
			//DEV console.log("target 1:")
			//DEV console.log(target);
			if (target.getAttribute("data-ghostedit-elemtype") !== "list") return false;
			
			// Get listitem-parent of anchor elem
			anchorelem = sourceelem;
			while (anchorelem.getAttribute("data-ghostedit-elemtype") !== "listitem") {
				anchorelem = ghostedit.dom.getParentGhostBlock (anchorelem);
				if (anchorelem === null) return false;
			}
			
			//alert(ghostedit.dom.getNextSiblingGhostBlock(anchorelem) + newElem.innerHTML);
			// If last listelem and inserted node empty (caret is at end), then instead create paragraph after list
			if (newelemisempty && ghostedit.dom.getNextSiblingGhostBlock(anchorelem) === false && ghostedit.plugins.textblock.isEmpty(sourceelem)) {
				parent = ghostedit.dom.getParentGhostBlock (target);
				handler = parent.getAttribute("data-ghostedit-handler");
				//alert(handler + parent.id + newElem.innerHTML + target.id);
				result = ghostedit.plugins[handler].dom.addchild(parent, "after", target, newElem);
			}
			if (result) {
				target.removeChild(anchorelem);
				//lasso().selectNode(newElem).collapseToStart().select();
				return result;
			}
			
			// If newElem is a textblock, wrap in one
			if (newElem.getAttribute("data-ghostedit-elemtype") === "textblock") {// !== "listitem"
				listitem = document.createElement("li");
				_list.itemelemid += 1;
				listitem.id = "ghostedit_listitem_" + _list.itemelemid;
				listitem.setAttribute("data-ghostedit-elemtype", "listitem");
				listitem.setAttribute("data-ghostedit-handler", "list");
				
				listitem.appendChild(newElem);
				//newElem = listitem;
			}
			else {
				listitem = newElem;
			}
			//var dummynode = document.createTextNode(String.fromCharCode(parseInt("200b", 16)));
			if (wheretoinsert === "before") {
				target.insertBefore(listitem, anchorelem);
			}
			else {
				if (anchorelem.nextSibling !== null) {
					target.insertBefore(listitem, anchorelem.nextSibling);
				}
				else {
					target.appendChild(listitem);
				}
			}
			return true;
		},
		
		removechild: function (target, child) {
			
			// Get target list if listelem is targetted
			if (target && target.getAttribute("data-ghostedit-elemtype") === "listitem") {
				child = target;
				target = ghostedit.dom.getParentGhostBlock (target);
			}
			
			if (!target || !child) return false;
			
			if (target.getAttribute("data-ghostedit-elemtype") !== "list") return false;
			
			
			// Get listitem-parent of anchor elem
			while (child.getAttribute("data-ghostedit-elemtype") !== "listitem") {
				child = ghostedit.dom.getParentGhostBlock (child);
				if (child === null) return false;
			}
			
			if (child.parentNode !== target) return false;
			
			target.removeChild(child);
			
			return true;
		}
	};
	
	_list.selection = {
		deleteContents: function (target, collapse) {
			var i, startelem, endelem, startblock, endblock, startcblock, 
			endcblock, childblocks, sametagtype, savedcontent, range, savedrange, dodelete, 
			r1, r2, b1, b2, firsttextblocktype, dummynode, insertId, insertedelem,
			startofblock, endofblock, selrange, atverystart, atveryend,
			firstchildblock, lastchildblock, condition, childblocktype, 
			status, message, handler, block;
			
			atverystart = false;
			atveryend = false;
			
			if (!_list.isList(target)){
				if (_list.isListItem (target)) {
					//DEV console.log("islistitem");
					return ghostedit.plugins.textblock.selection.deleteContents(ghostedit.dom.getFirstChildGhostBlock(target));
				}
				return false;
			}
			
			// Temporary selection range to avoid changing actual saved range
			if (ghostedit.selection.saved.type !== "textblock") return;
			selrange = ghostedit.selection.saved.data.clone();
			
			// Get first and last child ghostblock
			childblocks = target.childNodes;
			firstchildblock = ghostedit.dom.getFirstChildGhostBlock(target);
			lastchildblock = ghostedit.dom.getLastChildGhostBlock(target);
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(firstchildblock);
			endofblock = lasso().setCaretToEnd(lastchildblock);
			
			// If selrange starts before or at block, set startblock to the first child ghostblock
			if (selrange.compareEndPoints("StartToStart", startofblock) !== 1) {
				atverystart = true;
				startblock = firstchildblock;
			}
			// Otherwise, set child ghostblock containing the start of the selection
			else {
				startblock = selrange.getStartNode();
				if (!ghostedit.dom.isGhostBlock(startblock)) startblock = ghostedit.dom.getParentGhostBlock(startblock);
			}
			
			// If selrange ends after or at block, set endblock to the last child ghostblock
			if (selrange.compareEndPoints("EndToEnd", endofblock) !== -1) {
				atveryend = true;
				endblock = lastchildblock;
			}
			// Otherwise, set child ghostblock containing the end of the selection
			else {
				endblock = selrange.getEndNode();
				if (!ghostedit.dom.isGhostBlock(endblock)) endblock = ghostedit.dom.getParentGhostBlock(endblock);
			}
			
			startcblock = startblock;
			while(!ghostedit.dom.isChildGhostBlock(startcblock, target)) startcblock = ghostedit.dom.getParentGhostBlock(startcblock);
			endcblock = endblock;
			while(!ghostedit.dom.isChildGhostBlock(endcblock, target)) endcblock = ghostedit.dom.getParentGhostBlock(endcblock);
			
			// Cycle through SELECTED child ghostblocks and call delete method
			dodelete = atverystart;
			for(i = 0; i < childblocks.length; i += 1) {
				cblock = childblocks[i];
				if ( !ghostedit.dom.isGhostBlock(cblock) ) continue;
				handler = cblock.getAttribute("data-ghostedit-handler");
				
				if (!atverystart && cblock.id === startcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = true;
					if (cblock.id === endcblock.id) {
						break;
					}
					else {
						continue;
					}
				}
				else if (!atveryend && cblock.id === endcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = false;
					break;
				}
				else if (dodelete) {
					selrange.saveToDOM("seldelete-midlist");
					target.removeChild(childblocks[i]);
					selrange.restoreFromDOM("seldelete-midlist");
					i--;
				}
			}
	
			// If the first and last elements in the selection are the same type, then merge
			if(!atverystart && !atveryend && startcblock.getAttribute("data-ghostedit-elemtype") === endcblock.getAttribute("data-ghostedit-elemtype")) {
				ghostedit.plugins[startcblock.getAttribute("data-ghostedit-handler")].merge(startcblock, endcblock, collapse);
				if (!ghostedit.dom.getParentGhostBlock(endcblock)) lasso().setToSelection().collapseToStart().select();
				//^^tests whether endcblock is still in the document, i.e. whether a merge took place
			}
			
			if (!ghostedit.dom.getFirstChildGhostBlock(target)) {
				target.appendChild(_list.createItem("p"));
			}
	
			return true;
		}
	};
	
	_list.inout = {
		importHTML: function (sourcenode) {
			var newList, childcount, node, prevnode, parsednode;
			if (!sourcenode || !sourcenode.tagName) return false;
			switch (sourcenode.tagName.toLowerCase()) {
				case "ol":
				case "ul":
					return _list.inout.importList(sourcenode);
				case "li":
					newList = _list.create("ul");
					newList.setAttribute("data-ghostedit-importinfo", "wasinline");
					childcount = 0;
					node = sourcenode;
					do {
						console.log(node);
						parsednode = _list.inout.importListItem(node);
						if (parsednode) {
							childcount += 1;
							newList.appendChild(parsednode);
							prevnode = node;
							node = node.nextSibling;
							if (childcount > 1) prevnode.parentNode.removeChild(prevnode);
						}
						else break;
					}
					while (node && node.nodeType === 1 && node.tagName.toLowerCase() === "li");
					
					return (childcount > 0) ? newList : false;
			}
		},
		
		exportHTML: function (target) {
			if (!target || !ghostedit.dom.isGhostBlock(target)) return false;
			var finalCode = "", item, listtype;
			
			switch (target.getAttribute("data-ghostedit-elemtype")) {
				case "list":
					// Get first child list item (if none, return false)
					item = ghostedit.dom.getFirstChildGhostBlock (target);
					if (!item) return false;
					
					// Run export function for each list item						
					do {
						result = _list.inout.exportHTML (item);
						if (result) finalCode += result.content;
					}
					while (item = ghostedit.dom.getNextSiblingGhostBlock(item));
					
					// If no list items return code, return false
					if (finalCode.length < 1) return false;
					
					// Add list code to listitem code
					listtype = (target.tagName.toLowerCase() === "ol") ? "ol" : "ul";
					finalCode = "<" + listtype + ">" + finalCode + "</" + listtype + ">";
					
					// Return code
					return {content: finalCode};
				case "listitem":
					// Get first child GhostBlock of list item (if none, return false)
					elem = ghostedit.dom.getFirstChildGhostBlock (target);
					if (!elem) return false;
					
					// Assume textblock, and call export function
					result = ghostedit.plugins.textblock.inout.exportHTML (elem);
					if (result) finalCode += result.content;
					
					// If textblock doesn't return code (or isn't a textblock), return false 
					if (finalCode.length < 1) return false;
					
					// Add list item code to textblock code
					finalCode = "<li>" + finalCode + "</li>";
					
					// Return code
					return {content: finalCode};
			}
		},
		
		importList: function (sourcenode) {
			var i, list, handler, result, elem, tagname;
			if (!sourcenode || !sourcenode.tagName) return false;
			
			tagname = sourcenode.tagName.toLowerCase();
			if (tagname !== "ul" && tagname !== "ol") return false;
			
			// Create list element
			list = _list.create(tagname);
			
			// If chidlren, loop through and import if they are list items
			if (sourcenode.childNodes && sourcenode.childNodes.length) {
				for (i = 0; i < sourcenode.childNodes.length; i += 1) {
					elem = sourcenode.childNodes[i];
					if (elem.nodeType !== 1 || elem.tagName.toLowerCase() !== "li")  continue;
					
					result = _list.inout.importListItem(elem);
					if (result && ghostedit.dom.isGhostBlock(result)) {
						list.appendChild(result);
					}
				}
			}
			
			// Check any list item children have been added, else add empty list item
			if (!ghostedit.dom.getFirstChildGhostBlock(list)) {
				list.appendChild(_list.createItem("p"));
			}
			
			return list;
		},
		importListItem: function (sourcenode) {
			var i, list, handler, result, listitem, child, textblock = false;
			if (!sourcenode || !sourcenode.tagName || !sourcenode.tagName.toLowerCase() === "li") return false;
			listitem = _list.createItem();
					
			child = ghostedit.dom.getFirstChildElement (sourcenode);
			
			if (ghostedit.plugins.textblock.inout.isHandleableNode(child) === "block") {
				textblock = ghostedit.plugins.textblock.inout.importHTML (child);
			}
			else {
				//hack to deal with inline elements directly in list
				textblock = document.createElement("p");
				textblock.innerHTML = sourcenode.innerHTML;
				textblock = ghostedit.plugins.textblock.inout.importHTML (textblock);
			}
			
			if (textblock) {
				listitem.appendChild(textblock);
			}
			else {
				listitem.appendChild (ghostedit.plugins.textblock.create("p"));
			}
			
			return listitem;
		}
	};
	
	_list.paste = {
		handle: function (target, source, position) {
			var node, nodetype, i, pastednodes, cleannode, html, newnode, text, 
			selnode, blocks, textblock, anchor, result,
			sourcelistitem, sourcetextblock, targetlistitem, targettextblock, nextitem;
			
			if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isGhostBlock(source)) return;
			if (source.tagName.toLowerCase() !== "ol" && source.tagName.toLowerCase() !== "ul") return false;
			
			// Handle case where source list type is different to target list type
			if (source.tagName !== target.tagName) {
				
				anchor = ghostedit.selection.saved.data.clone().collapseToStart().getParentNode();
				while (!ghostedit.dom.isChildGhostBlock(anchor, target)) anchor = ghostedit.dom.getParentGhostBlock(anchor);
				
				result = _list.split(target, "after", anchor);
				
				switch (result) {
					case false:
						//this shouldn't happen, but just in case...
						return true;
					break;
					case "atverystart":
						node1 = ghostedit.dom.getPreviousSiblingGhostBlock(target);
						node2 = target;
						// TODO remove node1
					break;
					case "atveryend":
						node1 = target;
						node2 = ghostedit.dom.getNextSiblingGhostBlock(target);
						// TODO remove node2
					break;
					default:
						node1 = result.block1;
						node2 = result.block2;
				}
				lasso().removeDOMmarkers("ghostedit_paste_start");
				lasso().removeDOMmarkers("ghostedit_paste_end");
				node1.innerHTML += "<span id='ghostedit_paste_start_range_start'>&#x200b;</span>";
				node2.innerHTML = "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>" + node2.innerHTML;
				
				return false;
			}
			
			// Else, lists are of same type:
			
			startblock = ghostedit.selection.saved.data.clone().collapseToStart().getParentNode();
			while (!ghostedit.dom.isGhostBlock(startblock)) startblock = ghostedit.dom.getParentGhostBlock(startblock);
			endblock = ghostedit.selection.saved.data.clone().collapseToEnd().getParentNode();
			while (!ghostedit.dom.isGhostBlock(startblock)) startblock = ghostedit.dom.getParentGhostBlock(startblock);
			
			// If first pasted element, try to merge contents of first <li>
			if (position.isfirst) {
				sourcelistitem = ghostedit.dom.getFirstChildGhostBlock(source);
				sourcetextblock = ghostedit.dom.getFirstChildGhostBlock(sourcelistitem);
				
				targettextblock = startblock;
				targetlistitem = ghostedit.dom.getParentGhostBlock(targettextblock);
				
				if (sourcetextblock.tagName === targettextblock.tagName) {
				
					targettextblock.innerHTML += sourcetextblock.innerHTML;
					ghostedit.plugins.textblock.mozBrs.tidy(targettextblock);
					source.removeChild(sourcelistitem);
					
					if (!ghostedit.dom.getLastChildGhostBlock(source)) {
						if (position.islast) {
							nextitem = ghostedit.dom.getNextSiblingGhostBlock(targetlistitem);
							if (nextitem) {
								lasso().removeDOMmarkers("ghostedit_paste_start");
								targettextblock.innerHTML = targettextblock.innerHTML + "<span id='ghostedit_paste_start_range_start'>&#x200b;</span>" + ghostedit.dom.getFirstChildGhostBlock(nextitem).innerHTML;
								ghostedit.plugins.textblock.mozBrs.tidy(targettextblock);
								nextitem.parentNode.removeChild(nextitem);
							}
						}
						return true;
					}
					else {
						lasso().removeDOMmarkers("ghostedit_paste_start");
						targettextblock.innerHTML += "<span id='ghostedit_paste_start_range_start'>&#x200b;</span>";
						ghostedit.plugins.textblock.mozBrs.tidy(targettextblock);
						startblock = targetlistitem;
					}
				}
			}
			
			// If last pasted element, try to merge contents of last <li>
			if (position.islast && ghostedit.dom.getLastChildGhostBlock(source)) {
				sourcelistitem = ghostedit.dom.getLastChildGhostBlock(source);
				sourcetextblock = ghostedit.dom.getFirstChildGhostBlock(sourcelistitem);
				
				targettextblock = endblock;
				
				if (sourcetextblock.tagName === targettextblock.tagName) {
					lasso().removeDOMmarkers("ghostedit_paste_end");
					targettextblock.innerHTML = sourcetextblock.innerHTML + "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>" + targettextblock.innerHTML;
					source.removeChild(sourcelistitem);
					
					ghostedit.plugins.textblock.mozBrs.tidy(targettextblock);
				}
			}
			
			anchor = startblock;
			firstitem = item = ghostedit.dom.getFirstChildGhostBlock(source);
			
			while (item = ghostedit.dom.getFirstChildGhostBlock(source)) {
				_list.dom.addchild(target, "after", anchor, item);
				anchor = item;
			}
			
			if (!position.isfirst) {
				lasso().removeDOMmarkers("ghostedit_paste_start");
				anchor.innerHTML += "<span id='ghostedit_paste_start_range_start'>&#x200b;</span>";
				ghostedit.plugins.textblock.mozBrs.tidy(anchor);
			}
			
			if (!position.islast) {
				lasso().removeDOMmarkers("ghostedit_paste_end");
				endblock.innerHTML = endblock.innerHTML + "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>";
			}
			
			return true;
		}
	};
	
	_list.isList = function (list) {
		var tagname;
		if (!ghostedit.dom.isGhostBlock(list)) return false;
		tagname = list.tagName.toLowerCase();
		if (tagname !== "ul" && tagname !== "ol") return false;
		return true;
	};
	
	_list.isListItem = function (item) {
		var tagname;
		if (!ghostedit.dom.isGhostBlock(item)) return false;
		tagname = item.tagName.toLowerCase();
		if (tagname !== "li") return false;
		return true;
	};
	
	_list.create = function (listtype) {
		if (listtype.toLowerCase() !== "ol") listtype = "ul";
		
		// Create element, and assign id and content
		newElem = document.createElement(listtype);
		ghostedit.blockElemId += 1;
		newElem.id = "ghostedit_list_" + ghostedit.blockElemId;
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "list");
		newElem.setAttribute("data-ghostedit-handler", "list");
		
		return newElem;
	};
	
	_list.createItem = function (textblocktype) {
		
		// Create element, and assign id and content
		newElem = document.createElement("li");
		ghostedit.blockElemId += 1;
		newElem.id = "ghostedit_list_item_" + ghostedit.blockElemId;
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "listitem");
		newElem.setAttribute("data-ghostedit-handler", "list");
		
		
		if (textblocktype) newElem.appendChild(ghostedit.plugins.textblock.create(textblocktype));
		
		return newElem;
	};
	
	_list.remove = function (list) {
		var parent, handler;
		parent = ghostedit.dom.getParentGhostBlock(list);
		handler = parent.getAttribute("data-ghostedit-handler");
		return ghostedit.plugins[handler].dom.removechild(parent, list);
	};
	
	_list.focus = function (target) {
		var firstchild, handler;
		if (!target || target.nodeType !== 1 || target.getAttribute("data-ghostedit-elemtype") !== "list") return false;
		
		// Get first child of list
		firstchild = ghostedit.dom.getFirstChildGhostBlock (target);
		if (!firstchild) return false;
		
		// Get first child of listitem
		firstchild = ghostedit.dom.getFirstChildGhostBlock (firstchild);
		if (!firstchild) return false;
		
		handler = firstchild.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].focus(firstchild);
		
		return true;
	};
	
	_list.merge = function (list1, list2, collapse) {
		
		// If lists are same node, return that node
		if (list1 === list2) return list1;
		
		if (!_list.isList(list1) || !_list.isList(list2)) {
			if (_list.isListItem(list1) && _list.isListItem(list2)) {
				return _list.mergeItems(list1, list2, collapse);
			}
			return false;
		}
		
		// If lists are of different type, don't merge
		if (list1.tagName.toLowerCase() !== list2.tagName.toLowerCase()) return false;
		
		// Move all list items in list2 to list1
		while (child = ghostedit.dom.getFirstChildGhostBlock(list2)) {
			list1.appendChild (child);
		}
		
		// Remove list 2
		_list.remove(list2);
		
		return list1;
	};
	
	_list.mergeItems = function (item1, item2, collapse) {
		var tblock1, tblock2;
		
		// If collapse === false don't merge
		if (collapse === false) return item1;
		
		// If items are same node, return that node
		if (item1 === item2) return item1;
		
		if (!_list.isListItem(item1) || !_list.isListItem(item2)) return false;
		
		tblock1 = ghostedit.dom.getFirstChildGhostBlock(item1);
		tblock2 = ghostedit.dom.getFirstChildGhostBlock(item2);
		if (!tblock1 || !tblock2) return false;
		
		result = ghostedit.plugins.textblock.merge (tblock1, tblock2);
		/*if (result) {
			item2.parentNode.removeChild(item2);
			return result;
		}
		return false;*/
		return result;
	};
	
	_list.split = function (target, beforeOrAfter, anchor) {
		var firstitem, lastitem, newlist, node, parent, handler;
		if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isChildGhostBlock(anchor, target)) return false;
		if (beforeOrAfter !== "before") beforeOrAfter = "after";
		
		firstitem = ghostedit.dom.getFirstChildGhostBlock(target);
		lastitem = ghostedit.dom.getLastChildGhostBlock(target);
		if (beforeOrAfter === "before" && firstitem === anchor) return "atverystart";
		if (beforeOrAfter === "after" &&  lastitem === anchor) return "atveryend";

		node = anchor;
		newlist = _list.create (target.tagName.toLowerCase());
		parent = ghostedit.dom.getParentGhostBlock(target);
		handler = parent.getAttribute("data-ghostedit-handler");
		
		if (beforeOrAfter === "before") {
			node = firstitem;
			while (node) {
				if (node === anchor) break;
				newlist.appendChild(node);
				node = ghostedit.dom.getFirstChildGhostBlock(target);
				
			}
		}
		else {
			node = ghostedit.dom.getNextSiblingGhostBlock(anchor);
			while (node) {
				newlist.appendChild(node);
				node = ghostedit.dom.getNextSiblingGhostBlock(anchor);
			}
		}
		
		ghostedit.plugins[handler].dom.addchild(parent, beforeOrAfter, target, newlist);
		
		return (beforeOrAfter === "before") ? {"block1": newlist, "block2": target} : {"block1": target, "block2": newlist};
	};
	
	
	
	_list.toggle = function (listtype) {
		var i, inlist, list, intextbock, textblock, incontainer, container, node, 
		newlist = false, afterlist = false, tagname, parent, handler,
		beforenodes = [], selnodes = [], afternodes = [], selrange, range, isafterstart, isbeforeend,
		anchor, newblocks = [];
		
		listtype = (listtype === "ordered") ? "ol" : "ul";
		
		// Set checking variables to default value of false
		inlist = false;
		intextblock = false;
		incontainer = false;
		
		// Loop up through node path, check whether selection is contained within a list or textblock
		for(i = 0; i < ghostedit.selection.nodepath.length; i++) {
			node = ghostedit.selection.nodepath[i];
			switch (node.getAttribute("data-ghostedit-elemtype")){
				case "list":
					inlist = true;
					list = node;
				break;
				case "textblock":
					intextblock = true;
					textblock = node;
				break;
				case "container":
					incontainer = true;
					container = node;
				break;
			}
		}
		
		ghostedit.selection.savedRange.saveToDOM().select();
		
		// If selection contained in (non-list) textblock, convert to list
		if (intextblock && !inlist) {
			_list.convertTextblock(textblock, listtype);
			if (range = lasso().restoreFromDOM()) range.select();
			ghostedit.selection.save();
			return true;
		}
		
		// Else, if selection contained in list, convert list items to other list type, or to textblocks
		if (inlist) {
			_list.convertList(list, listtype);
			if (range = lasso().restoreFromDOM()) range.select();
			ghostedit.selection.save();
			return true;
		}
		
		// Else, if selection contained in container, go through container items converting to correct list form
		// skippping images, and then do massive tidy up at the end.
		if (incontainer) {
			_list.convertContainerContents(container, listtype);
			if (range = lasso().restoreFromDOM()) range.select();
			ghostedit.selection.save();
			return true;
		}
		
		return false;
	};
	
	_list.convertTextblock = function (textblock, listtype) {
			var newlist, newlistitem, tagname, parent, handler;
			// Create new list
			newlist = _list.create(listtype);
			
			// Create list item, and add it to list
			tagname = textblock.tagName.toLowerCase();
			newlistitem = _list.createItem();
			newlist.appendChild(newlistitem);
			
			// Add list to document
			parent = ghostedit.dom.getParentGhostBlock(textblock);
			handler = parent.getAttribute("data-ghostedit-handler");
			ghostedit.plugins[handler].dom.addchild(parent, "before", textblock, newlist);
			
			// Move textblock to listitem
			newlistitem.appendChild(textblock);
			
			// Call tidy function on list
			_list.tidy(newlist);
			
			// Focus textblock
			lasso().setCaretToEnd(textblock).select();
			ghostedit.selection.save();
			
			return textblock;
	};
	
	_list.convertList = function (list, listtype) {
			var i, lists = [], node, newlist = false, afterlist = false, tagname, parent, handler;
			var beforenodes = [], selnodes = [], afternodes = [], selrange, range, isafterstart, isbeforeend, anchor;
			
			node = ghostedit.dom.getFirstChildGhostBlock (list);
			if (!node) { _list.remove (list); return true; }
			
			ghostedit.selection.savedRange.restoreFromDOM("", false);

			// Loop through list items and get which nodes are in and after the selection
			do {
				isafterstart = lasso().setCaretToEnd(node).compareEndPoints("StartToStart", ghostedit.selection.savedRange);
				isafterstart = (isafterstart >= 0) ? true : false;
				isbeforeend = lasso().setCaretToStart(node).compareEndPoints("EndToEnd", ghostedit.selection.savedRange);
				isbeforeend = (isbeforeend <= 0) ? true : false;
				
				if (!isafterstart) {
					beforenodes.push(node);
				}
				else if (isafterstart && isbeforeend) {
					selnodes.push (node);
				}
				else {
					afternodes.push (node);
				}
			}
			while (node = ghostedit.dom.getNextSiblingGhostBlock(node));
			
			// Get list parent and handles for inserting and removing GhostBlocks
			parent = ghostedit.dom.getParentGhostBlock(list);
			handler = parent.getAttribute("data-ghostedit-handler");
			
			
			// Move the after nodes (if any) to a new list and add list after current one
			if (afternodes.length > 0) {
				afterlist = _list.create(list.tagName);
				
				for(i = 0; i < afternodes.length; i++) {
					afterlist.appendChild(afternodes[i]);	
				}
				
				ghostedit.plugins[handler].dom.addchild(parent, "after", list, afterlist);
			}
			
			// If toggle type = list type, move selnodes to parent, else create new list of other type
			anchor = list;
			if (list.tagName.toLowerCase() === listtype) {
				for(i = 0; i < selnodes.length; i++) {
					node = ghostedit.dom.getFirstChildGhostBlock(selnodes[i]);
					if (node) {
						ghostedit.plugins[handler].dom.addchild(parent, "after", anchor, node);
						anchor = node;
					}
					list.removeChild(selnodes[i]);
				}
				/*// Focus last node
				lasso().setCaretToEnd(node).select();
				ghostedit.selection.save();*/
			}
			else {
				newlist = _list.create(listtype);
				
				for(i = 0; i < selnodes.length; i++) {
					newlist.appendChild(selnodes[i]);	
				}
				
				ghostedit.plugins[handler].dom.addchild(parent, "after", list, newlist);
				
				/*// Focus first list item
				lasso().setCaretToEnd(selnodes[0]).select();
				ghostedit.selection.save();*/
			}
			
			// If no beforenodes, remove original list
			if (beforenodes.length === 0) {
				_list.remove(list);
				list = false;
			}
			
			// Call tidy function on all existing lists
			if (list) {
				_list.tidy(list);
				lists.push(list);
			}
			if (newlist)  {
				_list.tidy(newlist);
				lists.push(newlist);
			}
			if (afterlist) {
				_list.tidy(afterlist);
				lists.push(afterlist);
			}
			
			return lists;
	};
	
	_list.convertContainerContents = function (container, listtype) {
		var i, inlist, list, intextbock, textblock, incontainer, node, newlist = false, afterlist = false, 
		tagname, parent, handler, beforenodes = [], selnodes = [], afternodes = [], selrange, range,
		isafterstart, isbeforeend, anchor, newblocks = [];
		
		
		node = ghostedit.dom.getFirstChildGhostBlock (container);
			
		// Loop through container items call conversion functions on textblocks and lists
		do {
			isafterstart = lasso().setCaretToEnd(node).compareEndPoints("StartToStart", ghostedit.selection.savedRange);
			isafterstart = (isafterstart >= 0) ? true : false;
			isbeforeend = lasso().setCaretToStart(node).compareEndPoints("EndToEnd", ghostedit.selection.savedRange);
			isbeforeend = (isbeforeend <= 0) ? true : false;
			
			if (isafterstart && isbeforeend) {
				selnodes.push(node);
			}
			else if (!isbeforeend) break;

		}
		while (node = ghostedit.dom.getNextSiblingGhostBlock(node));
		
		for(i = 0; i < selnodes.length; i++) {
			node = selnodes[i];
			switch (node.getAttribute("data-ghostedit-elemtype")){
				case "list":
					//newblocks.concat( _list.convertList(node, listtype) );
					if (node.tagName.toLowerCase() !== listtype) _list.convertList(node, listtype);
				break;
				case "textblock":
					//newblocks.concat( [_list.convertTextblock (node, listtype)] );
					_list.convertTextblock (node, listtype);
				break;
			}
		}
		return true;
	};
	
	
	_list.tidy = function (list) {
		var prev, next, child, nextfirstchild, parent, handler, result;
		
		// If list contains no list items, remove list
		child = ghostedit.dom.getFirstChildGhostBlock(list);
		if (!child) {
			_list.remove(list);
			return true;
		}
		
		// Else if previous GhostBlock is a list of same type, merge lists
		prev = ghostedit.dom.getPreviousSiblingGhostBlock(list);
		result = _list.merge (prev, list);
		if (result) {
			// Set selection to first item in next list
			_list.focus(result);
			ghostedit.selection.save();
			
			// Call tidy function on previous list
			_list.tidy (result);
			
			return true;
		}
		
		// Else if next GhostBlock is a list of same type, merge lists
		next = ghostedit.dom.getNextSiblingGhostBlock(list);
		result = _list.merge (list, next);
		if (result) {
			// Set selection to first item in next list
			_list.focus(result);
			ghostedit.selection.save();
			
			// Call tidy function on previous list
			_list.tidy (result);
			
			return true;
		}
		return true;
	};
	
	_list.applydropevents = function(elem) {
		elem.ondragenter = function () { return false; };
		elem.ondragleave = function () { return false; };
		elem.ondragover = function () { return false; };
		elem.ondrop = function(e){
			var elem, elemid;
			elemid = e.dataTransfer.getData("text/plain") || e.srcElement.id;
			elem = document.getElementById(elemid);
			elem.parentNode.insertBefore(elem, this);
			ghostedit.image.focus(elem);
			ghostedit.util.cancelEvent(e);
				};
		elem.onresizestart = function(e){ return ghostedit.util.cancelEvent(e); };
	};
	
	ghostedit.api.plugin.register("list", _list);
})(window);