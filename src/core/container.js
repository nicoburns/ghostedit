(function (window, undefined) {
	
	var _container = {},
	lasso = window.lasso,
	ghostedit = window.ghostedit;
	
	_container.enable = function () {
		return true;
	};
		
	_container.dom = {
	
		addchild: function (target, wheretoinsert, anchorelem, newElem) {
			
			if (wheretoinsert === "before") {
				target.insertBefore(newElem, anchorelem);
			}
			else {
				if (anchorelem.nextSibling !== null) {
					target.insertBefore(newElem, anchorelem.nextSibling);
				}
				else {
					target.appendChild(newElem);
				}
			}
			
			return true;
		},
		
		removechild: function (target, child) {
			if (!target || !child) return false;
			
			target.removeChild(child);
			
			return true;
		}
		
		// Not currently needed, but comments left for easier future implementation
		/*deleteevent: function (target, sourcedirection, params) {
			switch (sourcedirection) {
				case "ahead":
					// Backspace was pressed at the start of the element after the container
				break;
				case "behind":
					// Delete was pressed at the end of the element before the container
				break;
				case "top":
					// Backspace was pressed at the start of the first child GhostBlock of the container
				break;
				case "bottom":
					// Delete was pressed at the end of the last child GhostBlock the container
				break;
			}
			return false;
		}*/
	};
		
	_container.selection = {
		deleteContents: function (container, collapse) {
			var i, 
			firstchildblock, lastchildblock, startofblock, endofblock, atverystart = false, atveryend = false,
			startblock, endblock, cblock, startcblock, endcblock, childblocks, dodelete, selrange, handler;
			
			// Temporary selection range to avoid changing actual saved range
			if(ghostedit.selection.saved.type !== "textblock") return false;
			selrange = ghostedit.selection.saved.data;
			
			// Get first and last child ghostblock
			childblocks = container.childNodes;
			firstchildblock = ghostedit.dom.getFirstChildGhostBlock(container);
			lastchildblock = ghostedit.dom.getLastChildGhostBlock(container);
			
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
			while(!ghostedit.dom.isChildGhostBlock(startcblock, container)) startcblock = ghostedit.dom.getParentGhostBlock(startcblock);
			endcblock = endblock;
			while(!ghostedit.dom.isChildGhostBlock(endcblock, container)) endcblock = ghostedit.dom.getParentGhostBlock(endcblock);
			
			//alert(startblock.id + endblock.id);
					
			
			/*//Handle selectall case
			if (isatverystart && isatveryend) {
				dodelete = false;
				firsttextblocktype = textblockelems[i].tagName.toLowerCase();
				for(i = 0; i < childblocks.length; i += 1) {
					if (childblocks[i].getAttribute("data-ghostedit-elemtype") !== undefined && childblocks[i].getAttribute("data-ghostedit-elemtype") !== false) {
						firstchildblock = childblocks[i];
						break;
					}
				}
				lasso().setCaretToStart(firstchildblock).select();
				return true;
			}*/
			
			//ghostedit.textblock.selection.deleteContents(lastchildblock);
			
			//alert("start - " + startblock.id + "\nend - " + endblock.id);
			
			// Cycle through SELECTED child ghostblocks and call delete method
			dodelete = false;
			for(i = 0; i < childblocks.length; i += 1) {
				
				cblock = childblocks[i];
				if ( !ghostedit.dom.isGhostBlock(cblock) ) continue;
				handler = cblock.getAttribute("data-ghostedit-handler");
				
				if (cblock.id === startcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = true;
					continue;
				}
				else if (cblock.id === endcblock.id) {
					ghostedit.plugins[handler].selection.deleteContents( cblock );
					dodelete = false;
					break;
				}
				
				if (dodelete) {
					container.removeChild(childblocks[i]);
					i--;
				}
					
			}
			
			
			// If the first and last elements in the selection are the same type, then merge
			if(startcblock.getAttribute("data-ghostedit-elemtype") === endcblock.getAttribute("data-ghostedit-elemtype")) {
				ghostedit.plugins[startcblock.getAttribute("data-ghostedit-elemtype")].merge(startcblock, endcblock, collapse);
				if (!ghostedit.dom.getParentGhostBlock(endcblock)) lasso().setToSelection().collapseToStart().select();
				//^^tests whether endcblock is still in the document, i.e. whether a merge took place
			}
			
			if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
				/*ghostedit.el.rootnode.innerHTML = "<div id='ghostedit_dummynode' data-ghostedit-elemtype='textblock'>Loading content...</div>";
				dummynode = document.getElementById('ghostedit_dummynode');
				lasso().selectNodeContents(dummynode).select();*/
				container.appendChild(ghostedit.textblock.create("p"));
			}
			
			// Place caret where the selection was
			//lasso().setCaretToStart(endelem).select();

			return true;
		}
	};
	
	_container.inout = {
		importHTML: function (sourcenode) {
			var container, result, i, elemcount, elem, tagname;
			if (!sourcenode || sourcenode.childNodes.length < 1) return false;
			
			container = _container.create();
			
			// For each source child node, check if appropriate import handler exists, if so then call it on the node
			for (i = 0; i < sourcenode.childNodes.length; i += 1) {
				elem = sourcenode.childNodes[i];
				if (elem.nodeType !== 1 && elem.nodeType !== 3)  continue;
				
				tagname = (elem.nodeType === 3) ? "#textnode" : elem.tagName.toLowerCase();
				/*if (handler = ghostedit.inout.importhandlers[tagname]) {
					result = ghostedit.plugins[handler].inout.importHTML(elem)
					if (result && ghostedit.dom.isGhostBlock(result)) {
						container.appendChild(result);
					}
				}*/
				if (ghostedit.inout.importhandlers[tagname]) {
					result = ghostedit.inout.importhandlers[tagname].call(this, elem);
					if (result && ghostedit.dom.isGhostBlock(result)) {
						container.appendChild(result);
					}
				}
				else if (elem.childNodes.length > 0) {
					elemcount = elem.childNodes.length;
					elem.parentNode.insertBefore(ghostedit.dom.extractContent(elem), elem);
					elem.parentNode.removeChild(elem);
					i -= 1;
				}
			}
			
			// Check any GhostBlock children have been added, else add empty paragraph
			if (!ghostedit.dom.getFirstChildGhostBlock(container)) {
				container.appendChild(ghostedit.plugins.textblock.create("p"));
			}
			
			return container;
		},
		
		exportHTML: function (target/*, includeself*/) { // Shouldn't be used without first using export prepare functions
			if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "container") return false;
			var i = 0, elem, blockreturn, finalCode = "", blockcount = 0, snippet, handler;
			
			//if (target.getAttribute("data-ghostedit-isrootnode") === true) isrootnode = true;
			
			// Allows for inclusion of enclosing <div> if wanted in future, may also want to retreieve properties
			//if (includeself === true) finalCode =+ "<div>";
			
			for (i = 0; i < target.childNodes.length; i += 1) {
				elem = ghostedit.dom.isGhostBlock( target.childNodes[i] ) ? target.childNodes[i] : false;
				if (!elem) continue;
				
				handler = elem.getAttribute("data-ghostedit-handler");
				if (!handler || !ghostedit.plugins[handler]) continue;
				
				blockreturn = ghostedit.plugins[handler].inout.exportHTML(elem);
				
				if (blockreturn) {
					finalCode += blockreturn.content;
					blockcount++;
				}
				
				//Create snippet from first 3 paragraphs
				if (blockcount <= 3){
					snippet = finalCode;
				}
			}
			
			return {content: finalCode, snippet: snippet};
		}
	};
	
	_container.paste = {
		handle: function (target, source, position) {
			var sel, anchor, newnode, dummy;
			if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isGhostBlock(source)) return true;
			if(position.isfirst || position.islast) return false;
			
			sel = ghostedit.selection.saved.data;
			anchor = sel.clone().collapseToStart().getParentElement();
			sel.saveToDOM("ghostedit_paste_start");
			
			if (anchor === target) {
				/* Just use range marker as dummy elem
				dummy = document.createElement("span");
				dummy.innerHTML = "&#x200b";
				dummy.id = "ghostedit_paste_dummy";
				sel.clone().collapseToStart().insertNode(dummy);*/
				dummy = document.getElementById("ghostedit_paste_start_range_start");
				anchor = ghostedit.dom.getPreviousSiblingGhostBlock(dummy) || dummy;
			}
			
			while (anchor.parentNode !== target) {
				anchor = anchor.parentNode;
				if (anchor === null || !anchor.parentNode) return true;
			}

			newnode = source.cloneNode(true);
			/*if (position.islast) {
				sel.removeDOMmarkers("ghostedit_paste");
				newnode.innerHTML = "<span id='ghostedit_paste_range_end'>&#x200b;</span>" + newnode.innerHTML;
			}
			else {
				document.getElementById("ghostedit_paste_range_start").parentNode.removeChild(document.getElementById("ghostedit_paste_range_start"));
			}*/
			lasso().removeDOMmarkers("ghostedit_paste_start");
			newnode.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t3'>&#x200b;</span>";
			
			_container.dom.addchild(target, "after", anchor, newnode);
			
			if (dummy && dummy.parentNode) dummy.parentNode.removeChild(dummy);
			return true;
			
		}
	};
	
	// TODO remove this function is favour of dom.isChildGhostBlock
	_container.isChildGhostBlock = function (elem, childblocks) {
		var i;
		if (!elem) return false;
		if (elem.nodeType !== 1) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === undefined) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === false) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === null) return false;
		for(i = 0; i < childblocks.length; i += 1) {
			if (elem === childblocks[i]) {
				return true;
			}
		}
		return false;
	};
	
	_container.create = function () {
		var newElem;
		// Create element, and assign id and content
		newElem = document.createElement("div");
		ghostedit.blockElemId += 1;
		newElem.id = "ghostedit_container_" + ghostedit.blockElemId;
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "container");
		newElem.setAttribute("data-ghostedit-handler", "container");
		
		return newElem;
	};
	
	_container.focus = function (target) {
		var firstchild, handler;
		if (!target || target.nodeType !== 1 || target.getAttribute("data-ghostedit-elemtype") !== "container") return false;
		
		// Get first child of container
		firstchild = ghostedit.dom.getFirstChildGhostBlock (target);
		if (!firstchild) return false;
		
		handler = firstchild.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].focus(firstchild);
		
		return true;
	};
	
	ghostedit.api.plugin.register("container", _container);
})(window);