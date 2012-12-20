(function (window, undefined) {
	
	var _textblock = {},
	lasso = window.lasso,
	ghostedit = window.ghostedit;
	
	_textblock.enable = function () {
				
		_textblock.format.init();
			
		ghostedit.inout.registerimporthandler (_textblock.inout.importHTML, "p", "h1", "h2", "h3", "h4", "h5", "h6");
		ghostedit.inout.registerimporthandler (_textblock.inout.importHTML, "#textnode", "b", "strong", "i", "em", "u", "strike", "span");
		
		// Bookmarkify (serialize) the selection, and save the bookmark to the lasso object
		ghostedit.event.addListener("postsaveundostate", function () {
			if (ghostedit.selection.saved.type === "textblock") {
				ghostedit.selection.saved.data.bookmarkify(ghostedit.el.rootnode);
			}
		});
		
		// Clone range object after undo save to avoid accidentally modifying the saved range objects
		ghostedit.event.addListener("postsaveundostate", function () {
			if (ghostedit.selection.saved.type === "textblock") {
				ghostedit.selection.saved.data = ghostedit.selection.saved.data.clone();
			}
		});
		
		ghostedit.api.insert = ghostedit.api.insert || {};
		ghostedit.api.insert.character = function (character) { return _textblock.insert.character(character); };
		ghostedit.api.insert.br = function () {return _textblock.insert.br; };
		
		return true;
	};
		
	_textblock.event = {
		keydown: function (target, keycode, event) {
			switch (keycode) {
				case 8: // backspace
					return _textblock.event.backspace(target, event);
				case 46: //delete
					return _textblock.event.deletekey (target, event);
			}
		},
		
		keypress: function (target, keycode, event) {
			// Enter key
			if (keycode === 13) return _textblock.event.enterkey (target, event);
		},
		
		backspace: function (block, e) {
			if (_textblock.selection.isAtStartOftextblock() !== true) {
				//Caret not at start of textblock: return true to indicate handled
				return true;
			}
			else {
				//var block = ghostedit.selection.getContainingGhostBlock();
				
				var params =  {
					"merge": {
						"contenttype": "inlinehtml",
						"sourcecontent": block.innerHTML,
						callback: ghostedit.util.preparefunction(function (node) {
							var parent = node.parentNode;
							var handler = parent.getAttribute("data-ghostedit-handler");
							ghostedit.plugins[handler].dom.removechild(parent, node);}, false, block)
					}
				};
				ghostedit.event.sendBackwards("delete", block, params );

				ghostedit.event.cancelKeypress = true;
				ghostedit.util.cancelEvent ( e );
				return true;
			}
		},
		
		deletekey: function (block, e) {
			//var block = ghostedit.selection.getContainingGhostBlock();
			if (_textblock.selection.isAtEndOftextblock() !== true) {
				//Caret not at end of textblock: return true to indicate handled
				return true;
			}
			else {
				ghostedit.event.sendForwards("delete", block);
				//_textblock.remove(_textblock.selection.getStartTextBlockNode());
				ghostedit.event.cancelKeypress = true;
				ghostedit.util.cancelEvent ( e );
				return true;
			}
		},
		
		enterkey: function (elem, e) {
			ghostedit.history.saveUndoState();
			
			if (e.shiftKey) {
				_textblock.insert.br();
				_textblock.mozBrs.tidy (elem);
			}
			else {
				_textblock.split(elem);
			}
			ghostedit.history.saveUndoState(true);
			
			ghostedit.util.cancelEvent ( e );
			return true;
		}
	};
	
	_textblock.dom = {
		deleteevent: function (target, sourcedirection, params){
			var parent, handler, block;
			switch (sourcedirection) {
				case "ahead":
					ghostedit.history.saveUndoState();
					if (!_textblock.isEmpty(target)) {
						target.innerHTML += "<span id='ghostedit_selection_marker'>&#x200b;</span>";
						if (params.merge && params.merge.sourcecontent && (params.merge.contenttype === "inlinehtml" || params.merge.contenttype === "text")) {
							target.innerHTML += params.merge.sourcecontent;
						}
						_textblock.mozBrs.tidy(target);
						params.merge.callback();
						//params.sourceblock.parentNode.removeChild(params.sourceblock);
						lasso().selectNode("ghostedit_selection_marker").select();//.deleteContents();
						document.getElementById("ghostedit_selection_marker").parentNode.removeChild(document.getElementById("ghostedit_selection_marker"));
						ghostedit.selection.save();
					}
					else {
						parent = ghostedit.dom.getParentGhostBlock(target);
						handler = parent.getAttribute("data-ghostedit-handler");
						//alert(target.id);
						ghostedit.plugins[handler].dom.removechild(parent, target);
					}
					ghostedit.history.saveUndoState(true);
					return true;
				case "behind":
					block = ghostedit.selection.getContainingGhostBlock();
					params =  {
						"merge": {
							"contenttype": "inlinehtml",
							"sourcecontent": target.innerHTML,
							"callback": ghostedit.util.preparefunction(function (node) {
										var parent = node.parentNode,
										handler = parent.getAttribute("data-ghostedit-handler");
										ghostedit.plugins[handler].dom.removechild(parent, node);
									}, false, target)
						}
					};
					ghostedit.event.sendBackwards("delete", target, params);
					//----------------------------------
					//_textblock.remove(_textblock.selection.getStartTextBlockNode());
					
					//ghostedit.event.cancelKeypress = true;
					//return ghostedit.util.cancelEvent ( e );
					return true;
			}
		}
	};
	
	_textblock.selection = {
		compare: function (r1, r2) {
			if (!r1 || !r1.isEqualTo) return false;
			return r1.isEqualTo(r2);
		},
		
		restore: function (savedrange) {
			if (!savedrange || !savedrange.unbookmarkify) return false;
			savedrange.unbookmarkify(ghostedit.el.rootnode);
			savedrange.select();
			return true;
		},
		
		deleteContents: function (textblockelem) {
			var startofblock, endofblock, selrange;
			
			// Temporary selection range to avoid changing actual saved range
			selrange = ghostedit.selection.savedRange.clone();
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(textblockelem);
			endofblock = lasso().setCaretToEnd(textblockelem);
			
			// If selrange starts before block, move start of selrange to start of block
			if (selrange.compareEndPoints("StartToStart", startofblock) === -1) {
				selrange.setStartToRangeStart(startofblock);
			}
			
			// If selrange end after block, move end of selrange to end of block
			if (selrange.compareEndPoints("EndToEnd", endofblock) === 1) {
				//alert(textblockelem.id);
				selrange.setEndToRangeEnd(endofblock);
			}
			
			selrange.deleteContents();
			
			return true;
		},
		
		getTextBlockNode: function (elem) {
			if (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-elemtype") !== "textblock") {
				while (elem.nodeType !== 1 || elem.getAttribute("data-ghostedit-elemtype") !== "textblock") {
					elem = elem.parentNode;
					if (elem === null) return false;
				}
			}
			return elem;
		},
		
		getStartTextBlockNode: function () {
			return _textblock.selection.getTextBlockNode( ghostedit.selection.savedRange.getStartNode() );
		},
		
		getEndTextBlockNode: function () {
			return _textblock.selection.getTextBlockNode( ghostedit.selection.savedRange.getEndNode() );
		},
		
		
		//Assumes selection saved manually
		isAtStartOftextblock: function () {
			var caretIsAtStart = false, range, selrange, i, isequal, firstnode, textblocknode, wholenode, tempnode;
			
			if(document.createRange) {
				range = ghostedit.selection.savedRange;
				if(range.isCollapsed() && range.getNative().startOffset === 0) {
					caretIsAtStart = true;
					tempnode = ghostedit.selection.savedRange.getStartNode();
				}
				
				if (!tempnode) return caretIsAtStart;
			
				// If tempnode not right at start
				while (tempnode.nodeType !== 1 || tempnode.getAttribute("data-ghostedit-elemtype") !== "textblock") {
					if (tempnode !== tempnode.parentNode.childNodes[0]) {
						isequal = false;
						if((tempnode.parentNode.childNodes[0].nodeType === 3 && tempnode.parentNode.childNodes[0].length === 0) ||
								(tempnode.parentNode.childNodes[0].nodeType === 1 && tempnode.parentNode.childNodes[0].className === "moz_dirty")) {
							//Deals with empty text nodes at start of textblock elem
							for(i = 1; i < tempnode.parentNode.childNodes.length; i += 1) {
								firstnode = tempnode.parentNode.childNodes[0];
								if (tempnode === tempnode.parentNode.childNodes[i]) {
									isequal = true;
									break;
								}
								else if(!(firstnode.nodeType === 3 && firstnode.length === 0) &&
									!(firstnode.nodeType === 1 && firstnode.className === "moz_dirty")) {
									break;
								}
							}
						}
						if(isequal !== true) {
							caretIsAtStart = false;
							break;
						}
					}
					tempnode = tempnode.parentNode;
				}	
			}
			else if (document.selection) {
				// Bookmarkify range, so DOM modification doesn't break it
				selrange = ghostedit.selection.savedRange.clone().bookmarkify();
				
				textblocknode = _textblock.selection.getStartTextBlockNode();
				
				// Get range representing the whole TextBlock contents
				wholenode = lasso().selectNodeContents( textblocknode );
				
				// Unbookmarkify the range, so it can be used in comparisons again
				selrange.unbookmarkify();
				
				// Compare html of wholenode with html of node starting from selected point, if eqaul then selection is at the start of the textblock
				if (wholenode.getHTML() === wholenode.setStartToRangeStart(selrange).getHTML()) {
						caretIsAtStart = true;
				}
				
				ghostedit.selection.savedRange = selrange.select();
			}
			return caretIsAtStart;
		},

		
		//Assumes selection saved manually
		isAtEndOftextblock: function () {
			var caretIsAtEnd = false, selrange, range, rangefrag, elemfrag, textblocknode, endpoint;
			
			if (!ghostedit.selection.savedRange.isCollapsed()) return false;
			
			textblocknode = _textblock.selection.getEndTextBlockNode();
			if(document.createRange) {
				
				rangefrag = document.createElement("div");
				rangefrag.appendChild( ghostedit.selection.savedRange.getNative().cloneContents() );
				
				range = ghostedit.selection.savedRange.getNative();
				range.setEnd(textblocknode, textblocknode.childNodes.length);
				elemfrag = document.createElement("div");
				rangefrag.appendChild( range.cloneContents() );
				
				_textblock.mozBrs.clear(rangefrag);
				_textblock.mozBrs.clear(elemfrag);
				
				if(rangefrag.innerHTML === elemfrag.innerHTML) {
					caretIsAtEnd = true;
				}
			}
			else if (document.selection) {
				// Bookmarkify range, so DOM modification doesn't break it
				selrange = ghostedit.selection.savedRange.clone().bookmarkify();
				
				// Get range representing the end of the TextBlock
				textblocknode.innerHTML += "<span id=\"range_marker\">&#x200b;</span>";
				endpoint = lasso().selectNode('range_marker');//.deleteContents();
				document.getElementById('range_marker').parentNode.removeChild(document.getElementById('range_marker'));
				
				// Unbookmarkify the range, so it can be used in comparisons again
				selrange.unbookmarkify();
				
				// Compare endpoint to selected point, if equal then selection is at the end of the textblock
				if (selrange.compareEndPoints("EndToEnd", endpoint) === 0) {
					caretIsAtEnd = true;
				}
				ghostedit.selection.savedRange = selrange.select();
			}
			return caretIsAtEnd;
		},
		
		extendtoword: function (range, onlyfrommiddle) {
			var wordstart, wordend;
			range = range.clone().getNative();
			if (document.createRange) {
				wordstart = _textblock.selection.findwordstart (range.startContainer, range.startOffset);
				wordend = _textblock.selection.findwordend (range.endContainer, range.endOffset);
				
				//If only one end has moved (or neither), then it's not from the middle
				if (onlyfrommiddle) {
					if (range.startContainer === wordstart.node && range.startOffset === wordstart.offset) return lasso().setFromNative(range);
					if (range.endContainer === wordend.node && range.endOffset === wordend.offset) return lasso().setFromNative(range);
				}
				
				range.setStart(wordstart.node, wordstart.offset);
				range.setEnd(wordend.node, wordend.offset);
			}
			else {
				range.expand("word");
				if (range.htmlText.split().reverse()[0] === " ") {
					range.moveEnd("character", -1);
				}
			}
			return lasso().setFromNative(range);
		},
		
		findwordstart: function (node, offset) {
			var leftnodecontent, stroffset, totalstroffset, prevnode, wordendregex = /\s|[\!\?\.\,\:\;\"]/;
			
			if (!node || !node.nodeType) return false;
			
			// Handle text node
			if (node.nodeType === 3) {
				leftnodecontent = node.nodeValue.substring(0, offset);
				stroffset = leftnodecontent.search(wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if(stroffset !== -1) {
					totalstroffset = stroffset + 1;
					while ((stroffset = leftnodecontent.substring(totalstroffset).search(wordendregex)) !== -1) {
						totalstroffset += stroffset + 1;
					}
					return { node: node, offset: totalstroffset };
				}
			}
			
			// Handle Element
			else if (node.nodeType === 1) {
				if (offset > 0) {
					return _textblock.selection.findwordstart(node.childNodes[offset - 1], node.childNodes[offset - 1].length);
				}
			}
			
			// If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (_textblock.isTextBlock(node)){
				return {"node": node, "offset": offset};
			}
			
			// If node is a NOT ghostedit_textblock: check previous node
			prevnode = node.previousSibling;
			if (prevnode) {
				if (prevnode.nodeType === 3) {
					return _textblock.selection.findwordstart(prevnode, prevnode.nodeValue.length);
				}
				else if (prevnode.nodeType === 1) {
					return _textblock.selection.findwordstart(prevnode, prevnode.childNodes.length);
				}
			}
			// If node is a NOT ghostedit_textblock and no previousSibling: move up tree
			else {
				return _textblock.selection.findwordstart(node.parentNode, ghostedit.dom.getNodeOffset(node));
			}
			
			
		},
		
		findwordend: function (node, offset) {
			var rightnodecontent, stroffset, totalstroffset, nextnode,
			wordendregex = /\s|[\!\?\.\,\:\;\"]/;
			
			if (!node || !node.nodeType) return false;
			
			// Handle text node
			if (node.nodeType === 3) {
				rightnodecontent = node.nodeValue.substring(offset);
				stroffset = rightnodecontent.search(wordendregex);
				//If there is a space or punctuation mark left of position in current textNode
				if (stroffset !== -1) {
					totalstroffset = offset + stroffset;
					return { node: node, offset: totalstroffset };
				}
			}
			
			// Handle Element
			else if (node.nodeType === 1) {
				if (offset < node.childNodes.length) {
					return _textblock.selection.findwordend(node.childNodes[offset], 0);
				}
			}
			
			// If no wordend match found in current node and node is a ghostedit_textblock: return current position
			if (_textblock.isTextBlock(node)){
				return {"node": node, "offset": offset};
			}
			
			// If node is a NOT ghostedit_textblock: check next node
			nextnode = node.nextSibling;
			if (nextnode) {
				return _textblock.selection.findwordend(nextnode, 0);
			}
			// If node is a NOT ghostedit_textblock and no nextSibling: move up tree
			else {
				return _textblock.selection.findwordend(node.parentNode, ghostedit.dom.getNodeOffset(node) + 1);
			}
		}
	};
	
	_textblock.inout = {
		handledtags: {
			"h1": "block", "h2": "block", "h3": "block", "h4": "block", "h5": "block", "h6": "block", "p": "block",
			"b": "child", "i": "child", "u": "child", "strong": "child", "em": "child", "strike": "child", "br": "child",
			"a": "contents", "span": "contents"
		},
		
		parserules: {
			"textnode": { "clean": true },
			"tags": {
				"h1": "textblock", "h2": "textblock", "h3": "textblock", "h4": "textblock", "h5": "textblock", "h6": "textblock", "p": "textblock",
				"b": {}, "i": {}, "u": {}, "strong": {}, "em": {}, "strike": {},
				"br": { "attributes": [ {"name": "class", "allowedvalues": [ "moz_dirty" ]} ] }
			},
			"templates": {
				"textblock": {
					"attributes": [ "class" ],
					"styles": [ 
						{"name": "textAlign", "allowedvalues": ["left", "right", "center", "justified"] },
						{"name": "clear", "allowedvalues": ["left", "right"] }
					]
				}
			}
		},
		
		importHTML: function (source) {
			var newTextBlock, tagname, node, childcount, prevnode, nodetype, parsednode;
			
			nodetype = _textblock.inout.isHandleableNode(source);
			switch (nodetype) {
				case "block":
					// Create TextBlock
					tagname = source.tagName.toLowerCase();
					newTextBlock = ghostedit.dom.parse(source, _textblock.inout.parserules);
					
					ghostedit.blockElemId += 1;
					newTextBlock.id = 'ghostedit_textblock_' + ghostedit.blockElemId;
					
					// Set GhostEdit handler attributes
					newTextBlock.setAttribute("data-ghostedit-iselem", "true");
					newTextBlock.setAttribute("data-ghostedit-elemtype", "textblock");
					newTextBlock.setAttribute("data-ghostedit-handler", "textblock");
					
					// Add event handlers
					newTextBlock.ondragenter = function(){return false;};
					newTextBlock.ondragleave = function(){return false;};
					newTextBlock.ondragover = function(){return false;};
					newTextBlock.ondrop = function(e){
						var elem, elemid;
						// This function does basic image paragraph changing dnd
						elemid = e.dataTransfer.getData("Text") || e.srcElement.id;
						//alert(elemid); TODO drag drop
						elem = document.getElementById(elemid);
						elem.parentNode.insertBefore(elem,this);
						ghostedit.image.focus(elem);
						};
					newTextBlock.onresizestart = function(e) {return ghostedit.util.cancelEvent(e);};
								
					_textblock.mozBrs.tidy (newTextBlock);
					return newTextBlock;
				case "child":
				case "contents":
				case "text":
					newTextBlock = _textblock.create("p");
					newTextBlock.setAttribute("data-ghostedit-importinfo", "wasinline");
					childcount = 0;
					node = source;
					do {
						parsednode = ghostedit.dom.parse(node, _textblock.inout.parserules);
						if (parsednode) {
							childcount += 1;
							newTextBlock.appendChild(parsednode);
							prevnode = node;
							node = node.nextSibling;
							if (childcount > 1) prevnode.parentNode.removeChild(prevnode);
						}
					}
					while (_textblock.inout.isHandleableNode(node) && _textblock.inout.isHandleableNode(node) !== "block");
					
					_textblock.mozBrs.tidy (newTextBlock);
					return (childcount > 0) ? newTextBlock : false;
			}
			return false;
		},
		
		exportHTML: function (target) {
			if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;	
			var finalCode = "", stylecode = "", elem;
			elem = target;
			
			_textblock.mozBrs.clear(elem);
	
			//if(elem.tagName.toLowerCase() == "p") paracount++;
			
			
			finalCode += "<" + elem.tagName.toLowerCase();
			
			// Extract styles
			if (elem.style.textAlign !== "") { stylecode += "text-align:" + elem.style.textAlign + ";"; }
			if (elem.style.clear !== "") stylecode += "clear:" + elem.style.clear + ";";
			
			if (stylecode.length > 0) finalCode += " style='" + stylecode + "'";
			
			// Extract class
			if (elem.className.length > 0 && !/ghostedit/.test(elem.className)) finalCode += " class='" + elem.className + "'";
			
			finalCode += ">";
			
			// Copy content and end tag
			finalCode += elem.innerHTML;
			finalCode += "</" + elem.tagName.toLowerCase() + ">";
			
			_textblock.mozBrs.tidy(elem);
			
			return {content: finalCode};
		},
		
		isHandleableNode: function (node) {
			var nodetag;
			if (!node || !node.nodeType) return false;
			
			// Handle textnode case
			if (node.nodeType === 3) return (node.nodeValue.replace(/[\n\r\t]/g,"").length > 0) ? "text" : false;
			
			// Handle not-element case (textnodes already handled)
			if (node.nodeType !== 1) return false;
			
			// Handle textblock case
			if(node.getAttribute("data-ghostedit-elemtype") === "textblock") return "block";
			
			// Handle other GhostBlock case (don't process other plugins' stuff)
			if (ghostedit.dom.isGhostBlock(node)) return false;
			
			// Else get tagname, and check handleable tag list
			nodetag = node.tagName.toLowerCase();				
			if (_textblock.inout.handledtags[nodetag]) {
				return _textblock.inout.handledtags[nodetag];
			}
			
			// Else return false
			return false;
		},
		
		parse: function (node) {
			var cleannode = false, nodes, cleanchild, nodetype, i, text;
			if (!node || !node.nodeType) return false;
			
			nodetype = _textblock.inout.isHandleableNode(node);
			switch (nodetype) {
				case "text":
					// Strip whitespace and tab characters from textnodes
					text = node.nodeValue.replace(/[\n\r\t]/g,"");
					// Return node, or false if node is empty
					return (text.length > 0) ? document.createTextNode(text) : false;
				case "block":
				case "child":
					cleannode = document.createElement(node.tagName.toLowerCase());
				/*case "contents":
					Do nothing*/
			}

			// For 'block', 'child' and 'contents' nodes: recurse on children and append
			cleannode = cleannode || document.createDocumentFragment();
			nodes = node.childNodes;
			for (i = 0; i < nodes.length; i++) {
				cleanchild = _textblock.inout.parse(nodes[i]);
				if (cleanchild) cleannode.appendChild(cleanchild);
			}
			return cleannode;
		}
	};
	
	_textblock.paste = {			
		handle: function (target, source, position) {
			var blocks;
			if (!ghostedit.dom.isGhostBlock(target) || !ghostedit.dom.isGhostBlock(source)) return;
			
			console.log(position);
			
			// If source is first pasted element, and was inline content, or is of same type as target, then merge contents into target node
			// No longer needed because is subset of 'p' check: source.getAttribute("data-ghostedit-importinfo") === "wasinline"
			if (position.isfirst) {
				if (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) {
					console.log("paste (first):");
					
					_textblock.mozBrs.clear(source);
					
					lasso().removeDOMmarkers("ghostedit_paste_start");
					source.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t1'>&#x200b;</span>";
					
					if (document.createRange) {
						ghostedit.selection.saved.data.collapseToStart().getNative().insertNode( ghostedit.dom.extractContent(source) );
					}
					else {
						ghostedit.selection.saved.data.collapseToStart().getNative().pasteHTML(source.innerHTML);
					}
					
					return true;
				}
				else {
					return false;
				}
			}
			
			if (position.islast) {
				if (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) {
					console.log("paste (last-noncollapsed):");
					
					_textblock.mozBrs.clear(source);
					lasso().removeDOMmarkers("ghostedit_paste_end");
					source.innerHTML += "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>";
					
					if (document.createRange) {
						ghostedit.selection.saved.data.collapseToStart().getNative().insertNode( ghostedit.dom.extractContent(source) );
					}
					else {
						ghostedit.selection.saved.data.collapseToStart().getNative().pasteHTML(source.innerHTML);
					}
					
					return true;
				}
				else {
					return false;
				}
			}
			
			
			
			// If not first element, then split and tidy
			_textblock.mozBrs.clear(source);
			ghostedit.selection.saved.data.collapseToStart().select();
			lasso().removeDOMmarkers("ghostedit_paste_start");//Must be before split or marker is duplicated
			blocks = _textblock.split(target);
			blocks.block1.innerHTML += "<span id='ghostedit_paste_start_range_start' class='t2'>&#x200b;</span>";
			_textblock.mozBrs.tidy(blocks.block1);
			
			/*if (!position.islast || !(source.tagName.toLowerCase() === "p" || source.tagName === target.tagName) && _textblock.isEmpty(blocks.block2)) {
				parent = ghostedit.dom.getParentGhostBlock(blocks.block2);
				handler = parent.getAttribute("data-ghostedit-handler");
				
				marker = document.createElement("span");
				marker.id = "ghostedit_paste_end_range_start";
				marker.innerHTML = "&#x200b;";
				
				lasso().removeDOMmarkers("ghostedit_paste_end");
				ghostedit.plugins[handler].dom.addchild(parent, "after", blocks.block2, marker);
				ghostedit.plugins[handler].dom.removechild(parent, blocks.block2);
				return false;
			}*/
			
			//if (position.collapsed) {
				lasso().removeDOMmarkers("ghostedit_paste_end");
				blocks.block2.innerHTML = "<span id='ghostedit_paste_end_range_start'>&#x200b;</span>" + blocks.block2.innerHTML;
			//}
			_textblock.mozBrs.tidy(blocks.block2);
			
			// If source is last pasted element, and was inline content, or is of same type as target, then prepend contents to second node
			/*if (position.islast && (source.tagName.toLowerCase() === "p" || source.tagName === target.tagName)) {
				//DEV console.log("paste (last):");
				//DEV console.log(blocks.block2);
				blocks.block2.innerHTML = source.innerHTML + blocks.block2.innerHTML;
				blocks.block2 = _textblock.format.setTagType({"textblock": blocks.block2, "tagname": source.tagName.toLowerCase()});
				return true;
			}*/
			
			
			
			//DEV console.log(blocks.block1.parentNode.cloneNode(true));
			
			return false;
		},
		
		clean: function (target) {
			var content, cleanchild, i;
			if (!target || !target.nodeType) return false;
			
			// If target is empty, return target
			if (!target.childNodes) return target;
			
			// Else loop through content, getting clean versions of each child node recursively
			content = document.createDocumentFragment();
			for (i = 0; i < target.childNodes.length; i++) {
				cleanchild = _textblock.paste.cleanChild(target.childNodes[i]);
				if (cleanchild)	content.appendChild(cleanchild);
			}
			
			// Replace target content with new content
			target = target.cloneNode(false);
			target.appendChild(content);
			
			return target;
		},
		
		cleanNode: function (node) {
			var cleannode, nodes, cleanchild, nodetype, i;
			if (!node || !node.nodeType) return false;
			
			nodetype = _textblock.paste.isHandleableNode(node);
			switch (nodetype) {
				case "text":
					// Strip whitespace and tab characters from textnodes
					node.nodeValue = node.nodeValue.replace(/[\n\r\t]/g,"");
					return node;
				case "child":
				case "contents":
					// If allowed childnode, or contentsnode recurse on children, and append
					cleannode = (nodetype === "child") ? node.cloneNode(false) : document.createDocumentFragment();
					nodes = node.childNodes;
					for (i = 0; i < nodes.length; i++) {
						cleanchild = _textblock.paste.cleanNode(nodes[i]);
						if (cleanchild)	cleannode.appendChild(cleanchild);
					}
					return cleannode;
			}
			
			// Else return false
			return false;
		}
	};
	
	_textblock.isTextBlock = function (textblock) {
		if (!ghostedit.dom.isGhostBlock(textblock)) return false;
		if (textblock.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;
		return true;
	};
	
	_textblock.isEmpty = function (textblock) {
		var textcontent, imgs, brs, i;
		
		// If the node contains textual content then it's not empty
		//if (ghostedit.util.strip_tags(textblockelem.innerHTML).length > 1) return false;
		
		textcontent = textblock.innerText || textblock.textContent;
		if (textcontent && textcontent.length > 1) return false;
		
		// If the node contains no textual content and no <br> or <img> tags then it is empty
		brs = textblock.getElementsByTagName("br");
		imgs = textblock.getElementsByTagName("img");
		if (brs.length === 0 && imgs.length === 0) return true;
		
		// Otherwise check for non MozDirty <br>'s
		for(i = 0; i < brs.length; i += 1) {
			if(brs[i].MozDirty === undefined && !/moz_dirty/.test(brs[i].className)) return false;
		}
		
		// If none are found then it's empty
		return true;
	};
	
	_textblock.isFirst = function (textblockelem) {
		var rootnode, i;
		rootnode = ghostedit.el.rootnode;
		for(i = 0; i < rootnode.getElementsByTagName("*").length; i += 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				if(rootnode.getElementsByTagName("*")[i] === textblockelem) {
					return true;
				}
				else {
					return false;
				}
			}
		}
	};
	
	_textblock.isLast = function (textblockelem) {
		var rootnode, i;
		rootnode = ghostedit.el.rootnode;
		for(i = rootnode.getElementsByTagName("*").length - 1; i > 0; i -= 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				if(rootnode.getElementsByTagName("*")[i] === textblockelem) {
					return true;
				}
				else {
					return false;
				}
			}
		}
	};
	
	_textblock.count = function () {
		var rootnode, childCount, i;
		rootnode = ghostedit.el.rootnode;
		childCount = 0;
		for(i = 0; i < rootnode.getElementsByTagName("*").length; i += 1) {
			if(rootnode.getElementsByTagName("*")[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				childCount += 1;
			}
		}
		return childCount;
	};
	
	_textblock.create = function (elemtype, content, id) {
		var newElem;
		
		// If explicit id not passed, get next blockElemId
		if (!id) {
			ghostedit.blockElemId += 1;
			id = 'ghostedit_textblock_' + ghostedit.blockElemId;
		}
		
		// If no content sent, set to default content of ""      ---"Edit Here!"
		content = (content && ((content.length && content.length > 0) || content.nodeType)) ? content : "";//"Edit Here!";
		
		// Create element, and assign id and content
		newElem = document.createElement(elemtype);
		newElem.id = id;
		if (content.nodeType) {
			content = ghostedit.dom.parse(content, {"textnode": { "clean": true }, "tags": { "b": {}, "i": {}, "u": {}, "strong": {}, "em": {}, "strike": {}, "br": {} } });
			if (content) newElem.appendChild(content);
		}
		else {
			newElem.innerHTML = content;
		}
		
		// Set GhostEdit handler attributes
		newElem.setAttribute("data-ghostedit-iselem", "true");
		newElem.setAttribute("data-ghostedit-elemtype", "textblock");
		newElem.setAttribute("data-ghostedit-handler", "textblock");
		
		// Add event handlers
		newElem.ondragenter = function(){return false;};
		newElem.ondragleave = function(){return false;};
		newElem.ondragover = function(){return false;};
		newElem.ondrop = function(e){
			var elem, elemid;
			// This function does basic image paragraph changing dnd
			elemid = e.dataTransfer.getData("Text") || e.srcElement.id;
			//alert(elemid); TODO drag drop
			elem = document.getElementById(elemid);
			elem.parentNode.insertBefore(elem,this);
			ghostedit.image.focus(elem);
			};
		newElem.onresizestart = function(e) {return ghostedit.util.cancelEvent(e);};
		
		// Tidy MozBr's in new element
		_textblock.mozBrs.tidy(newElem);
		
		return newElem;
	};
	
	_textblock.remove = function (textblockelem) {
		var savedElemContent, rootnode, focuselem, i, thisone, textblockelems;

		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
		
		// If textblock elem still contains content, save to variable for appending to previous textblock elem
		savedElemContent = "";
		savedElemContent = textblockelem.innerHTML;
		
		// Cycle through textblock elements backwards to select the one before the current one to focus
		rootnode = ghostedit.el.rootnode;
		textblockelems = rootnode.getElementsByTagName("*");
		thisone = false;
		for(i = textblockelems.length - 1; i >= 0; i -= 1) {
			if (thisone === true && textblockelems[i].getAttribute("data-ghostedit-elemtype") === "textblock") {
				focuselem = textblockelems[i];
				break;
			}
			else if (textblockelems[i] === textblockelem) {
				thisone = true;
			}
		}
		
		// If focuselem is empty, delete it instead (intuitive behaviour)
		if (_textblock.isEmpty(focuselem)) {
			rootnode.removeChild(focuselem);
			
			lasso().setCaretToStart(textblockelem).select();
			
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			return;
		}
		
		
		// Remove textblock elem
		rootnode.removeChild(textblockelem);
		
		// Set caret to end of focuselem
		lasso().setCaretToEnd(focuselem).select();
		ghostedit.selection.save();
		
		// Add saved content
		focuselem.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + savedElemContent;
		
		// Sort out MozBr's (one at very end of elements, that's it)
		_textblock.mozBrs.tidy(focuselem);
		
		// Place caret in correct place
		lasso().selectNode('ghostedit_marker').deleteContents().select();
		if (document.getElementById('ghostedit_marker')) {
			document.getElementById('ghostedit_marker').parentNode.removeChild(document.getElementById('ghostedit_marker'));
		}
		

		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_textblock.focus = function (target) {
		if (!target || target.nodeType !== 1 || target.getAttribute("data-ghostedit-elemtype") !== "textblock") return false;
		
		lasso().setCaretToEnd(target).select();
		ghostedit.selection.save();
		return true;
	};
	
	_textblock.merge = function (block1, block2, collapse) {
		var block1type, block2type, parent, handler;
		
		// If collapse === false don't merge
		if (collapse === false) return block1;
		
		// If blocks are same node, return that node
		if (block1 === block2) return block1;
		
		block1type = block1.getAttribute("data-ghostedit-elemtype");
		block2type = block2.getAttribute("data-ghostedit-elemtype");
		
		// If one of the blocks isn't a textblock, return false
		if (block1type !== "textblock" || block2type !== "textblock") return false;
		
		// Otherwise, append block2content to block1 and delete block2
		block1.innerHTML += "<span id='ghostedit_marker'>&#x200b;</span>" + block2.innerHTML;
		parent = block2.parentNode;
		handler = parent.getAttribute("data-ghostedit-handler");
		ghostedit.plugins[handler].dom.removechild(parent, block2);
		_textblock.mozBrs.tidy(block1);
		lasso().selectNode("ghostedit_marker").select();//.deleteContents();
		document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
		return block1;
	};
	
	_textblock.split = function (elem) {
		ghostedit.selection.save();
		var wheretoinsert, atstart, atend, elemtype, savedElemContent, range, result, newTextBlock, parent, handler;
		
		atstart = (_textblock.selection.isAtStartOftextblock() === true) ? true : false;
		atend = (_textblock.selection.isAtEndOftextblock() === true) ? true : false;
		wheretoinsert = (atstart && !atend) ? "before" : "after";
		elemtype = (wheretoinsert === "before" || atend) ? "p" : _textblock.selection.getStartTextBlockNode().tagName;
		
		//console.log("atstart - " + atstart+ "\natend - " + atend + "\nwhere - " + wheretoinsert);
		
		// Tidy MozBr's in original element
		_textblock.mozBrs.tidy(elem);
		
		// Save and the delete the content after the caret from the original element
		if(!atstart && !atend) {//wheretoinsert === "after") {
			if (document.createRange) {
				range = lasso().selectNodeContents( elem ).setStartToRangeStart(ghostedit.selection.savedRange); // Odd bug (at least in chrome) where savedRange is already to the end.
				savedElemContent = range.getHTML();
				range.deleteContents();
			}
			else if (document.selection) {		
				// Bookmark lines allow innerHTML to be modified as long as it is put back to how it was
				/*savedrange = ghostedit.selection.savedRange.getNative().getBookmark();
				range = lasso().selectNodeContents( elem );
				ghostedit.selection.savedRange.getNative().moveToBookmark(savedrange);
				range.getNative().setEndPoint("StartToEnd", ghostedit.selection.savedRange.getNative());*/
				range = lasso().selectNode(elem);
				range.setStartToRangeEnd(ghostedit.selection.savedRange);
				savedElemContent = range.getHTML();
				range.getNative().text = "";
			}
		}
		else {
			savedElemContent = "";
		}
		
		/*result = _textblock.insert(elem, elemtype, false, wheretoinsert, savedElemContent); */
		
		// Create new element for inserting
		newTextBlock = _textblock.create(elemtype, savedElemContent);
		if (!newTextBlock) return false;
		
		// Ask (ghost) parent to insert new element into page
		parent = ghostedit.dom.getParentGhostBlock(elem);
		handler = parent.getAttribute("data-ghostedit-handler");
		result = ghostedit.plugins[handler].dom.addchild (parent, wheretoinsert, elem, newTextBlock, {"contentlength": savedElemContent.length});
		
		if (!result) return false;
		/* IF !result, replace saved and deleted content after cursor */
		
		// Workaround for ie (6?) bug which doesn't allow an empty element to be selected
		newTextBlock.innerHTML = "dummy";
		lasso().selectNode(newTextBlock).select();
		newTextBlock.innerHTML = savedElemContent;
		
		// Tidy MozBrs (previous code section often) removes all MozBrs)
		_textblock.mozBrs.tidy(newTextBlock);
		
		// Set caret to start of new element
		if(wheretoinsert === "before") {
			lasso().setCaretToBlockStart(elem).select();
		}
		else {
			lasso().setCaretToBlockStart(newTextBlock).select();
		}
		ghostedit.selection.save();
		// block1 = first in dom; block2 = second in dom
		return {"block1": wheretoinsert === "before" ? newTextBlock : elem, "block2": wheretoinsert === "before" ? elem :newTextBlock};
	};
	
	_textblock.mozBrs = {		
		checkifcontains: function (node) {
			var elements, i;
			elements = node.getElementsByTagName("br");
			
			for(i = 0; i < elements.length; i += 1) {
				if(elements[i].MozDirty !== undefined) return true;
			}
			
			return false;
		},
		
		insert: function (elem) {
			var brNode;
			brNode = document.createElement("br");
			brNode.setAttribute("_moz_dirty", "");
			brNode.className = "moz_dirty";
			elem.appendChild(brNode);
		},
		
		clear: function (node) {
			var elements, i;
			elements = node.getElementsByTagName("br");
			
			for(i = 0; i < elements.length; i += 1) {
				if(elements[i].MozDirty !== undefined || /moz_dirty/.test(elements[i].className)) {
					elements[i].parentNode.removeChild(elements[i]);
					i--; //One less element in live list, so decrease iterator
				} 
			}
		},
		
		tidy: function (elem) {
			_textblock.mozBrs.clear(elem);
			if(ghostedit.useMozBr) {
				_textblock.mozBrs.insert(elem);
			}
		}
		
	};
	
	_textblock.insert = {
		character: function (character) {
			if(ghostedit.selection.saved.type === "textblock") {
				ghostedit.selection.restore();
				ghostedit.selection.savedRange.pasteText(character);
			}
		},
		
		br: function () {
			//var isEmpty = false;
			var s, newBr, r;
			if (window.getSelection) {
				s = window.getSelection();
				s.getRangeAt(0).collapse(false);
				newBr = document.createElement("br");
				newBr.id = "newBr";
				s.getRangeAt(0).insertNode(newBr);
				s.getRangeAt(0).selectNode(newBr.parentNode);
				//alert(newBr.nextSibling);
				r = document.createRange();
				r.setStartAfter(newBr);
				r.setEndAfter(newBr);
				s.removeAllRanges();
				s.addRange(r);
				document.getElementById("newBr").removeAttribute("id");
			}
			else if (document.selection) { 
				r = document.selection.createRange();
				r.collapse(false);
				r.pasteHTML("<br id='newBr' />");
				r.moveToElementText(document.getElementById("newBr"));
				r.collapse(false);
				r.select();
				document.getElementById("newBr").removeAttribute("id");
			}
		}
	};
		
	_textblock.format = {
		init: function () {
			
			ghostedit.api.format = ghostedit.api.format || {};
			
			ghostedit.api.format.setStyle = function (tagname, newclass) {
				_textblock.format.formatSelected(_textblock.format.setTagType, {"tagname": tagname,"newclass": newclass});
			};
			
			ghostedit.api.format.alignText = function (alignDirection) {
				if (!/left|right|center|justify/.test(alignDirection)) return false;
				_textblock.format.formatSelected(_textblock.format.alignText, {"alignDirection": alignDirection});
			};
			
			ghostedit.api.format.bold = function () {
				_textblock.format.formatSelected(_textblock.format.bold);
			};
			
			ghostedit.api.format.italic = function () {
				_textblock.format.formatSelected(_textblock.format.italic);
			};
			
			ghostedit.api.format.underline = function () {
				_textblock.format.formatSelected(_textblock.format.underline);
			};
			
			ghostedit.api.format.strikethrough = function () {
				_textblock.format.formatSelected(_textblock.format.strikethrough);
			};
			
			ghostedit.api.format.textColor = function (color) {
				_textblock.format.formatSelected(_textblock.format.textColor, {"color": color});
			};
		},
		
		useCommand: function (commandType, param) {
			//var i, nodes, node, selrange, startofblock, endofblock;
			//if (typeof param == "undefined") { param = null; }
			//if (ghostedit.selection.saved.type !== "text") return false;
			//ghostedit.history.saveUndoState();
			document.execCommand(commandType, false, param);
			//ghostedit.selection.save();
			//ghostedit.history.saveUndoState();
		},
		
		getNextNode: function (node) {
			if (node.firstChild) return node.firstChild;
			while (node) {
				if (node.nextSibling) return node.nextSibling;
				node = node.parentNode;
			}
		},
		
		getNodesInRange: function (range) {
			var start = range.getStartNode(),
			end = range.getEndNode(),
			commonAncestor = range.getParentNode(),
			nodes = [],
			node;
			
			// walk parent nodes from start to common ancestor
			for (node = start.parentNode; node; node = node.parentNode) {
				nodes.push(node);
				if (node === commonAncestor) break;
			}
			nodes.reverse();
			
			// walk children and siblings from start until end is found
			for (node = start; node; node = _textblock.format.getNextNode(node)) {
				nodes.push(node);
				if (node === end) break;
			}
			
			return nodes;
		},
		
		useCommandOnWord: function (command) {
			var range, marker;
			if (ghostedit.selection.savedRange.isCollapsed() && _textblock.selection.getStartTextBlockNode()) {
				range = ghostedit.selection.savedRange.clone();
				if (document.createRange) {
					marker = document.createElement("span");
					marker.id = "ghostedit_marker";
					range.getNative().insertNode(marker);
				}
				if (!document.createRange && document.selection) {
					range.getNative().pasteHTML("<span id='ghostedit_marker'>z</span>");
				}
				range.selectNode("ghostedit_marker");
				range = _textblock.selection.extendtoword(range, true);
				range.select();
			}
			/* Placing cursor inside empty <b> doesn't work in ie <=8 (might work in 6/7)
			if (range.isCollapsed() && document.selection) {
				if (document.selection) {
					range.getNative().pasteHTML("<b><span id='ghostedit_marker'>&#x200b;</span></b>");
					alert(lasso().selectNodeContents("ghostedit_marker").getHTML());//.select().deleteContents();
					//document.getElementById("ghostedit_newnode").innerHTML = "";
					//document.getElementById("ghostedit_newnode").id = "";
				}
			}
			else {*/
			_textblock.format.useCommand(command);
			
			if (document.getElementById("ghostedit_marker")) {
				lasso().selectNode("ghostedit_marker").select();
				document.getElementById("ghostedit_marker").parentNode.removeChild(document.getElementById("ghostedit_marker"));
			}
			ghostedit.selection.save();
		},
		
		bold: function () {
			_textblock.format.useCommand("bold");
		},
		
		italic: function () {
			_textblock.format.useCommand("italic");
		},
		
		underline: function () {
			_textblock.format.useCommand("underline");
		},
		
		strikethrough: function () {
			_textblock.format.useCommand("strikethrough");
		},
		
		textColor: function (color) {
			_textblock.format.useCommand("foreColor",color);
		},
		
		
		formatSelected: function (formatFunc, params) {
			var elem, startpara, endpara, oldelem, doend, i, descendantblocks;
			ghostedit.selection.save();
			ghostedit.history.saveUndoState();
			
			startpara = _textblock.selection.getStartTextBlockNode();
			endpara = _textblock.selection.getEndTextBlockNode();
		
			if (startpara && endpara) {
				elem = startpara;
				doend = false;
				do {
					if (elem === ghostedit.el.rootnode || elem === null) break;
					
					
					
					if (_textblock.isTextBlock(elem)) {
						if (elem === endpara) doend = true;
						elem = _textblock.format.formatTextBlock(elem, ghostedit.selection.saved.data.clone(), formatFunc, params);
						if (doend) break;
						elem = elem.nextSibling ? elem.nextSibling : elem.parentNode;
						continue;
					}
					else if (ghostedit.dom.isDescendant(elem, endpara)) {
						elem = ghostedit.dom.getFirstChildElement(elem);
						continue;
					}
					else {
						oldelem = elem; //necessary because setTagType kills list item (and if no list item, then no nextSibling)
						elem = elem.nextSibling ? elem.nextSibling : elem.parentNode;
							
						descendantblocks = oldelem.getElementsByTagName("*");
						for(i = 0; i < descendantblocks.length; i += 1) {
							if (_textblock.isTextBlock(descendantblocks[i])) {
								_textblock.format.formatTextBlock(descendantblocks[i], ghostedit.selection.saved.data.clone(), formatFunc, params);
							}
						}
					}
					
				
				}
				while (true);
				
				ghostedit.selection.save();
				ghostedit.history.saveUndoState();
			}
			
			
			ghostedit.history.saveUndoState();
		},
		
		formatTextBlock: function (textblock, range, formatFunc, params) {
			var startofblock, endofblock, newelem;
			
			if (!params) params = {};
			params.textblock = textblock;
			
			// Clone range to avoid reference errors
			range = range.clone();
			
			// Ranges representing the start and end of the block
			startofblock = lasso().setCaretToStart(textblock);
			endofblock = lasso().setCaretToEnd(textblock);
			
			// If range doesn't intersect textblock return false
			//console.log(range.compareEndPoints("EndToStart", startofblock));
			//console.log(range.compareEndPoints("StartToEnd", endofblock));
			if (range.compareEndPoints("EndToStart", startofblock) === -1 || range.compareEndPoints("StartToEnd", endofblock) === 1) return false;
			
			// If range starts before block, move start of selrange to start of block
			if (range.compareEndPoints("StartToStart", startofblock) === -1) range.setStartToRangeStart(startofblock);
			
			// If range end after block, move end of selrange to end of block
			if (range.compareEndPoints("EndToEnd", endofblock) === 1) range.setEndToRangeEnd(endofblock);
			
			ghostedit.selection.saved.data.clone().saveToDOM("ghostedit_format");
			//if(textblock.id === "ghostedit_textblock_4") return;
			range.select();
			newelem = formatFunc(params);
			
			lasso().restoreFromDOM("ghostedit_format").select();
			ghostedit.selection.save();
			
			return newelem && newelem.nodeType !== undefined ? newelem : textblock;
		},
		
		alignText: function(params) {
				var elem = lasso().setToSelection().getParentElement();
				while (!ghostedit.dom.isGhostBlock(elem)) {
					elem = elem.parentNode;
					if (elem === null) return false;
				}
				if (!_textblock.isTextBlock(elem)) return false;
				elem.style.textAlign = params.alignDirection;
		},
		

		// .tagName is readonly -> need to remove element and add new one
		setTagType: function (params) {
			var target, tagtype, newclass, parent, targetid, newTextBlock;
			
			target = params.textblock;
			tagtype = params.tagname;
			newclass = params.newclass;
			
			// Retrieve target node
			//target = target || ghostedit.selection.nodepath[0];
			if (!_textblock.isTextBlock(target)) return false;
			
			// Save id of target
			targetid = 'ghostedit_textblock_' + target.id.replace("ghostedit_textblock_","");
			
			// Create replacement element, and copy over attributes/html
			newTextBlock = _textblock.create(tagtype);
			newTextBlock.appendChild(ghostedit.dom.extractContent(target));
			_textblock.mozBrs.tidy(newTextBlock);
			newTextBlock.setAttribute("style", target.getAttribute("style"));
			if (newclass !== undefined) newTextBlock.className = newclass;

			
			// Use naive DOM manipulation because just doing an in place swap
			parent = target.parentNode;
			target.id = "";
			parent.insertBefore(newTextBlock, target);
			parent.removeChild(target);
			
			// Set id of new TextBlock
			newTextBlock.id = targetid;
			
			return newTextBlock;
		}
	};
	
	ghostedit.api.plugin.register("textblock", _textblock);
})(window);