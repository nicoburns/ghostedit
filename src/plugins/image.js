(function (window, undefined) {
	var _image= {
		elemid: 0,
		focusedimage: null, 
		justResized: false, //prevents loss of image focus after rezise in IE
		originalMouseX: null, originalMouseY: null, //Image resize variables
		buttons: [],
		el: {}
	};
	
	_image.enable = function () {
		// Register event listeners
		ghostedit.event.addListener ("preundo", function () { _image.unfocus() });
		ghostedit.event.addListener ("preredo", function () { _image.unfocus() });
		//ghostedit.event.addListener ("export:before", function () { _image.unfocus() });
		
		ghostedit.event.addListener ("postundo", function () { _image.applyeventlisteners() });
		ghostedit.event.addListener ("postredo", function () { _image.applyeventlisteners() });
		
		ghostedit.event.addListener ("selection:change", function () {
			if (ghostedit.selection.saved.type !== "image") {
				_image.ui.hide();
			}
		});
		
		ghostedit.event.addListener ("ui:newcontext", function (params) {
			var context = params.context;
			
			switch (context) {
				case "image":
				case "help":
				case "save":
					return;
			}
			
			_image.unfocus();
		});
		
		// Register import capbability
		ghostedit.inout.registerimporthandler (_image.inout.importHTML, "img");
		
		// Register default options
		if (!ghostedit.options.image) ghostedit.options.image = {};
		if (!ghostedit.options.image.disableresize) ghostedit.options.image.disableresize = false;
		if (!ghostedit.options.image.flexibleimages) ghostedit.options.image.flexibleimages = false;
		
		// Add form to capture keystrokes when an image has focus
		var form = document.createElement("form");
		form.id = "ghostedit_image_focusform";
		form.style.cssText = "margin:0px;padding:0px;height:0px;width:0px;overflow:hidden;line-height: 0px";
		
		var textarea = document.createElement("textarea");
		textarea.id = "ghostedit_image_keycapturearea";
		textarea.onkeypress = ghostedit.util.cancelEvent;
		textarea.onkeydown = _image.event.keydown;
		_image.el.keycapture = textarea;
		
		form.appendChild(textarea);
		ghostedit.wrapdiv.appendChild(form);
		
		// Export api functions
		ghostedit.api.image = ghostedit.api.image || {};
		
		ghostedit.api.image.updatealttext = function (value) {
			return _image.updatealttext(value);
		}
	};
	
	_image.event = {
		keydown: function (e) {
			e = window.event != null ? window.event : e;
			var keycode = e.keyCode != null ? e.keyCode : e.charCode;
			
			switch(keycode) {
				case 8:
				case 46:
					_image.remove(e);
				break;
				case 90:
					if (e.ctrlKey) {
						ghostedit.history.undo ();
					}
				break;
				case 89:
					if (e.ctrlKey) {
						ghostedit.history.redo ();
					}
				break;
				case 37:
					_image.move.align("left", e);
				break;
				case 38:
					_image.move.up(e);
				break;
				case 39:
					_image.move.align("right", e);
				break;
				case 40:
					_image.move.down(e);
				break;
			}
			return ghostedit.util.cancelEvent ( e );
		},
		
		insertButtonClick: function () {
			ghostedit.selection.save();
			var i, that = [], elem, images, modalcontent;
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
			"<input type='button' value='Insert' style='float: right;margin-top: 10px;' onclick='_image.newImageBefore(null, null);ghostedit.ui.modal.hide();' />" +
			"</form>" +
			"";
			
			/*images = [
			{id: "5", name: "test3", url: "data/pages/images/large/5.jpg", thumburl: ""},
			{id: "6", name: "test2", url: "data/pages/images/large/6.jpg", thumburl: "data/pages/images/small/6.jpg"}
			];*/
			
			images = [];
			
			if(ghostedit.options.uploadedimages) {
				images = ghostedit.options.uploadedimages;
			}
			
			ghostedit.ui.modal.show(modalcontent);
			
			for(i = 0; i < images.length; i += 1) {
				elem = document.createElement("div");
				elem.className = "ghostedit-listbox-item";
				elem.setAttribute("ghostedit-listitem-value", images[i].url);
				elem.innerHTML = "<img src='" + images[i].thumburl + "' style='height: 60px; float: left' /><p style='margin-left: 100px;font-size: 21px'>" + images[i].name + "</p>";
				elem.onclick = function () {
					_image.newImageBefore(null, this.getAttribute("ghostedit-listitem-value"), false);
					ghostedit.ui.modal.hide();
				}
				document.getElementById("ghostedit_listbox").appendChild(elem);
			}
			
			document.getElementById('ghostedit_imageurlinput').focus();
		}
	};
	
	_image.selection = {
		compare: function (image1, image2) {
			if (!image1 || !image2) return false;
			return !!(image1 === image2);
		},
		
		restore: function (image) {
			if (!image || !image.tagName || image.tagName.toLowerCase() !== "img") return false;
			_image.focus(image);
			return true;
		},
		
		deleteContents: function(image) {
			//Do nothing (images shouldn't be deleted via selection)
			return true;
		}
	}
	
		_image.inout = {
		importHTML: function(source) {
			var newimg, nw, nh, editorw;
			
			// Create image element using source image's src				
			newimg = _image.create(source.src);
			if (!newimg) return false;
			
			// Apply attributes
			if (source.className.length > 0 && !/ghostedit/.test(source.className)) {
				newimg.className = source.className;
			}
			newimg.alt = source.alt;
			newimg.title = source.title;
			
			nw = newimg.width;
			nh = newimg.height;
			
			newimg.naturalWidth = newimg.naturalWidth || nw;
			newimg.naturalHeight = newimg.naturalHeight || nh;
			newimg.setAttribute("data-ghostedit-nativewidth", nw);
			newimg.setAttribute("data-ghostedit-nativeheight", nh);
			
			editorw = ghostedit.wrapdiv.offsetWidth;// - ghostedit.editdiv.style.paddingLeft.replace("px", "") - ghostedit.editdiv.style.paddingRight.replace("px", "");

			if(!ghostedit.options.image.flexibleimages) {
				if (source.style.width.replace("px", "") > 0 && source.style.width.replace("px", "") < editorw) {
					newimg.style.width = source.style.width;
				}
				else {
					newimg.style.width = "200px";
				}
				newimg.style.height = (newimg.style.width.replace("px", "") / nw) * nh;
			}
			newimg.style.cssFloat = source.style.cssFloat;
			newimg.style.styleFloat = source.style.styleFloat;
			newimg.style.clear = source.style.clear;
			if (source.style.cssFloat == "right" || source.style.styleFloat == "right") {
				newimg.style.marginLeft = "20px";
				newimg.style.marginRight = "0px";
			}
			else {
				newimg.style.marginLeft = "0px";
				newimg.style.marginRight = "20px";
			}
			
			// TODO import:after event which resizes too big images
			
			return newimg;
		},
		
		exportHTML: function (target) {
			if (!target || !ghostedit.dom.isGhostBlock(target) || target.getAttribute("data-ghostedit-elemtype") !== "image") return false;	
			var finalCode = "", elem;
			elem = target;
			
			finalCode += "<img src='" + elem.src.toString() + "' alt='" + elem.alt.toString() + "' title='" + elem.title.toString() + "' ";
			finalCode += "style='";
			if(!ghostedit.options.image.flexibleimages) {
				finalCode += "width:" + elem.offsetWidth.toString() + "px;height; " + elem.offsetHeight + "px;";
			}
			if (elem.style.styleFloat == "left" || elem.style.cssFloat == "left") {
				finalCode += "float:left;clear:left;margin-right: 20px;";
			}
			else {
				finalCode += "float:right;clear:right;margin-left: 20px;";
			}
			if (elem.style.clear != "") finalCode += "clear:" + elem.style.clear;
			finalCode += "'";
			if (elem.className.length > 0 && !/ghostedit/.test(elem.className)) finalCode += " class='" + elem.className + "'";
			finalCode += " />";
			
			return {content: finalCode};
		}
	};
	
	_image.ghostevent = function (eventtype, target, sourcedirection, params) {
		switch (eventtype) {
			case "delete":
				return false; // Don't handle (= passthrough)
			break;
		}
	};
	
	_image.move = {
		align: function (direction, e) {
			var img;
			if (direction !== "left" && direction !== "right") return ghostedit.util.cancelAllEvents(e);
			if (ghostedit.selection.saved.type !== "image") return ghostedit.util.cancelAllEvents(e);

			ghostedit.history.saveUndoState();
			img = ghostedit.selection.saved.data;
			
			img.style.styleFloat = direction;
			img.style.cssFloat = direction;
			img.style.marginRight = (direction === "left") ? "20px" : "0px";
			img.style.marginLeft = (direction === "left") ? "0px" : "20px";

			_image.focus(img);
			ghostedit.history.saveUndoState();
			
			return ghostedit.util.cancelAllEvents(e);
		},
		
		up: function (e) {
			var i, img, editdiv, textblockelems, thisone, storedimg, offsetTopBefore, offsetLeftBefore, parent, handler;
			ghostedit.history.saveUndoState();
			if (_image.focusedimage != null) {
				img = _image.focusedimage;
				offsetLeftBefore = img.offsetLeft;
				offsetTopBefore = img.offetTop;
				
				if (anchor = ghostedit.dom.getPreviousSiblingGhostBlock(img)) {
					parent = ghostedit.dom.getParentGhostBlock(anchor);
					handler = parent.getAttribute("data-ghostedit-handler");
					ghostedit.plugins[handler].dom.addchild(parent, "before", anchor, img);
				}				
				
				// If the image is still in the same position, then remove it's clear style
				if(offsetLeftBefore == img.offsetLeft && img.offsetTopBefore == img.offsetTop) {
					img.style.clear = "";
				}
				else {
					img.style.clear = "";
				}
				_image.focus(_image.focusedimage);
			}
			ghostedit.history.saveUndoState();
			return ghostedit.util.cancelAllEvents(e);
		},
		
		down: function (e) {
			var i, img, editdiv, textblockelems, thisone, nextone, elem = false, storedimg, parent, handler;
			ghostedit.history.saveUndoState();
			if (_image.focusedimage != null) {
				img = _image.focusedimage;
				offsetLeftBefore = img.offsetLeft;
				offsetTopBefore = img.offetTop;
				
				if (anchor = ghostedit.dom.getNextSiblingGhostBlock(img)) {
					parent = ghostedit.dom.getParentGhostBlock(anchor);
					handler = parent.getAttribute("data-ghostedit-handler");
					ghostedit.plugins[handler].dom.addchild(parent, "after", anchor, img);
				}				
				
				// If the image is still in the same position, then remove it's clear style
				if(offsetLeftBefore == img.offsetLeft && img.offsetTopBefore == img.offsetTop) {
					img.style.clear = "";
				}
				else {
					img.style.clear = "";
				}
				_image.focus(_image.focusedimage);
			}
			ghostedit.history.saveUndoState();
			return ghostedit.util.cancelAllEvents(e);
		}
	};
	
	_image.setClear = function (clearval) {
		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
		
		var elem, startpara, endpara;
		startpara = ghostedit.textblock.selection.getStartTextBlockNode();
		endpara = ghostedit.textblock.selection.getEndTextBlockNode();
		
		// Loop through selected paragraphs
		if (startpara && endpara) {
			elem = startpara;
			do {
				if (elem.getAttribute("data-ghostedit-elemtype").toLowerCase() == "textblock") {
					startpara.style.clear = clearval;
				}
				if (elem.nextSibling && elem.id != endpara.id) {
					elem = elem.nextSibling;
				}
				else {
					break;
				}
			}
			while (true);
		}
		
		// Loop through images attached to startpara
		elem = startpara;
		while (elem.previousSibling && elem.previousSibling.getAttribute("data-ghostedit-elemtype") == "image") {
			elem = elem.previousSibling;
			elem.style.clear = clearval;
		}
		
		document.getElementById('ghostedit_toolbar_clearselect').value = clearval;
		
		ghostedit.selection.save();
		ghostedit.history.saveUndoState();
	};
	
	_image.remove = function (e) {
		ghostedit.history.saveUndoState();
		if (_image.focusedimage != null) {
			var imgToDel = _image.focusedimage;
			_image.unfocus();
			if (imgToDel.parentNode) {
				imgToDel.parentNode.removeChild(imgToDel);
			}
		}
		if (e && e.preventDefault) {
			e.stopPropagation();//stops parent elements getting a click event (standards)
		}
		else if (window.event.cancelBubble != null) {
			window.event.cancelBubble = true; //stops parent elements getting a click event (IE)
		}
		ghostedit.history.saveUndoState();
		return false;
	};
	
	_image.refocus = function () {
		var img = _image.focusedimage;
		_image.unfocus();
		_image.focus(img);
	};
	
	_image.unfocus = function () {
		_image.resize.end();
		_image.focusedimage = null;
		if (ghostedit.selection.saved.type !== "image")  return false;
		var image = ghostedit.selection.saved.data;
		
		_image.ui.hide(image);
		
		ghostedit.selection.clear();
		ghostedit.selection.save();
	};
	
	_image.updatealttext = function (newalt) {
		if (_image.focusedimage != false && _image.focusedimage.alt != newalt) {
			_image.focusedimage.alt = newalt;
			_image.focusedimage.title = newalt;
			ghostedit.event.trigger("ui:message", {message: "Image description updated to '" + newalt + "'", time: 2, color: "success"});
		}
	};
	
	
	
	_image.focus = function (img, e) {
		var existHandle, resizeHandle, border, b, html, imgIdNum, imgToolbar;
		_image.unfocus();
		if (ghostedit.isEditing === true && _image.focusedimage === null) {
			
			imgIdNum = img.id.replace("ghostedit_image_","");
			
			// Add border to image
			border = document.createElement("div");
			border.className = "ghostedit_image_border";
			border.id = "ghostedit_image_border_" + imgIdNum;
			border.style.top = img.offsetTop + "px";
			border.style.left = img.offsetLeft + "px";
			border.style.width = (img.offsetWidth - 6) + "px";
			border.style.height = (img.offsetHeight - 6) + "px";
			ghostedit.contextuallayer.appendChild(border);

			// Remove existing resize handle
			if (existHandle = document.getElementById("ghostedit_image_resizehandle_" + imgIdNum)) {
				ghostedit.contextuallayer.removeChild(existHandle);
			}
			
			//Resize handle
			if(!ghostedit.options.image.disableresize) {
				resizeHandle = document.createElement("span");
				resizeHandle.className = "ghostedit_image_resizehandle";
				resizeHandle.id = "ghostedit_image_resizehandle_" + imgIdNum;
				resizeHandle.style.top = (img.offsetTop + img.offsetHeight - 13) + "px";
				if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
						resizeHandle.style.left = (img.offsetLeft + img.offsetWidth - 13) + "px";
						resizeHandle.style.cursor = "se-resize";
						resizeHandle.style.background = "URL(" + ghostedit.options.imageurl + "/image/resize-se.png)";
				}
				else {
						resizeHandle.style.left = (img.offsetLeft) + "px";
						resizeHandle.style.cursor = "sw-resize";
						resizeHandle.style.background = "URL(" + ghostedit.options.imageurl + "/image/resize-sw.png)";
				}
				ghostedit.contextuallayer.appendChild(resizeHandle);
				resizeHandle.style.MozUserSelect = 'none';
				resizeHandle.contentEditable = false;
				resizeHandle.unselectable = 'on';
				resizeHandle.onmousedown = function(event){ return _image.resize.start(this, event);};
				resizeHandle.ondragstart = function(event){ return ghostedit.util.cancelEvent(event); };
				resizeHandle.ondraggesture = function(event){return ghostedit.util.cancelEvent(event); };
				resizeHandle.onclick = function (event) { return ghostedit.util.cancelEvent(event); };
				resizeHandle.ondblclick = function(event){return ghostedit.util.cancelEvent(event); };
				resizeHandle.onresizestart = function(event){return ghostedit.util.cancelEvent(event); };
			}
			
			
			
			//Align button
			b = _image.ui.createbutton(imgIdNum, "align", ">", function (img, button) {
				button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15) + "px";
				if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
					button.elem.style.left = (img.offsetLeft + img.offsetWidth - 15) + "px";
					button.elem.innerHTML = "&gt;";
				}
				else {
					button.elem.style.left = (img.offsetLeft - 15) + "px";
					button.elem.innerHTML = "&lt;";
				}
			});
			if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
				b.event.click = function(event){return _image.move.align("right", event);};
			}
			else {
				b.event.click = function(event){return _image.move.align("left", event);};
			}
			b.register();
			
			//Delete button
			b = _image.ui.createbutton(imgIdNum, "delete", "&#215;", function (img, button) {
				button.elem.style.top = (img.offsetTop) + "px";
				button.elem.style.left = (img.offsetLeft) + "px";
			});
			b.event.click = function(event){return _image.remove(event);};
			b.register();
			
			//Up button
			b = _image.ui.createbutton(imgIdNum, "up", "^", function (img, button) {
				//button.elem.style.top = (img.offsetTop - 15) + "px";
				//button.elem.style.left = (img.offsetLeft + (img.offsetWidth/2) - 15) + "px";
				button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15 - 40) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft + img.offsetWidth - 15 : img.offsetLeft - 15) + "px";
			});
			b.event.click = function(event){return _image.move.up(event);};
			//b.register();
			
			//Down button
			b = _image.ui.createbutton(imgIdNum, "down", "&caron;", function (img, button) {
				//button.elem.style.top = (img.offsetTop + img.offsetHeight - 15) + "px";
				//button.elem.style.left = (img.offsetLeft + (img.offsetWidth/2) - 15) + "px";
				button.elem.style.top = (img.offsetTop + (img.offsetHeight/2) - 15 + 40) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft + img.offsetWidth - 15 : img.offsetLeft - 15) + "px";
			});
			b.event.click = function(event){return _image.move.down(event);};
			//b.register();
			
			//Small size button
			b = _image.ui.createbutton(imgIdNum, "small", "Small", function (img, button) {
				button.elem.style.top = (img.offsetTop + 40) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 60) + "px";
				button.elem.style.width = '60px';
			});
			b.event.click = function(event){
				var img = _image.focusedimage; 
				img.className = 'small';
				img.style.height = "";
				img.style.width = "";
				img.style.height = (img.offsetHeight - 12) + "px";
				img.style.width = (img.offsetWidth - 12) + "px";
				_image.ui.setbuttonpositions();
				return ghostedit.util.cancelEvent(event);
			};
			//b.register();
			
			//Golden size button
			b = _image.ui.createbutton(imgIdNum, "golden", "Golden", function (img, button) {
				button.elem.style.top = (img.offsetTop + 80) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 80) + "px";
				button.elem.style.width = '80px';
			});
			b.event.click = function(event){
				var img = _image.focusedimage; 
				img.className = 'golden';
				img.style.height = "";
				img.style.width = "";
				img.style.height = (img.offsetHeight - 12) + "px";
				img.style.width = (img.offsetWidth - 12) + "px";
				_image.ui.setbuttonpositions();
				return ghostedit.util.cancelEvent(event);
			};
			//b.register();
			
			//Medium size button
			b = _image.ui.createbutton(imgIdNum, "medium", "Medium", function (img, button) {
				button.elem.style.top = (img.offsetTop + 120) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 80) + "px";
				button.elem.style.width = '80px';
			});
			b.event.click = function(event){
				var img = _image.focusedimage; 
				img.className = 'medium';
				img.style.height = "";
				img.style.width = "";
				img.style.height = (img.offsetHeight - 12) + "px";
				img.style.width = (img.offsetWidth - 12) + "px";
				_image.ui.setbuttonpositions();
				return ghostedit.util.cancelEvent(event);
			};
			//b.register();
			
			//Fullwidth size button
			b = _image.ui.createbutton(imgIdNum, "fullwidth", "Full Width", function (img, button) {
				button.elem.style.top = (img.offsetTop + 160) + "px";
				button.elem.style.left = (img.style.cssFloat == "left" || img.style.styleFloat == "left" ? img.offsetLeft : img.offsetLeft + img.offsetWidth - 100) + "px";
				button.elem.style.width = '100px';
			});
			b.event.click = function(event){
				var img = _image.focusedimage; 
				img.className = 'fullwidth';
				img.style.height = "";
				img.style.width = "";
				img.style.height = (img.offsetHeight - 12) + "px";
				img.style.width = (img.offsetWidth - 12) + "px";
				_image.ui.setbuttonpositions();
				return ghostedit.util.cancelEvent(event);
			};
			//b.register();
			
			//Clear button
			html = "<select onclick='ghostedit.util.preventBubble()' onchange='_image.focusedimage.style.clear = this.value;_image.refocus();'>";
			html += "<option value='' " + (img.style.clear == '' ? "selected='selected' " : "") + ">Clear: none</option>";
			html += "<option value='left' " + (img.style.clear == 'left' ? "selected='selected' " : "") + ">Clear: left</option>";
			html += "<option value='right' " + (img.style.clear == 'right' ? "selected='selected' " : "") + ">Clear: right</option>";
			html += "<option value='both' " + (img.style.clear == 'both' ? "selected='selected' " : "") + ">Clear: both</option>";
			html += " </select>";
			b = _image.ui.createbutton(imgIdNum, "clear", html, function (img, button) {
				button.elem.style.top = (img.offsetTop) + "px";
				button.elem.style.left = (img.offsetLeft + (img.offsetWidth) - 100) + "px";
				button.elem.style.width = '100px';
				button.elem.style.cursor = 'default';
			});
			b.event.click = null;
			b.event.mousedown = null;
			//b.register();
			
			for(i = 0; i < _image.buttons.length; i += 1) {
				_image.buttons[i].show(img);
				_image.buttons[i].reposition(img, _image.buttons[i]);
			}
			
			/*ghostedit.selection.saved.type = "image";
			ghostedit.selection.saved.data = img;
			ghostedit.selection.updatePathInfo(img);
			ghostedit.event.trigger("ui:update");*/
			ghostedit.selection.set("image", img);
			
			_image.focusedimage = img;
			
			ghostedit.event.trigger("ui:newcontext", {context: "image"});
			
			if (e) return ghostedit.util.cancelEvent ( e );
		}
	};
	
	_image.resize = {

		start: function ( resizeHandle, e ) {
			ghostedit.history.saveUndoState();
			if (e == null) { e = window.event; }
			var img = document.getElementById("ghostedit_image_" + resizeHandle.id.replace("ghostedit_image_resizehandle_",""));
			
			_image.originalMouseX = e.pageX || e.clientX + document.body.scrollLeft;
			_image.originalMouseY = e.pageY || e.clientY + document.body.scrollTop;
			
			_image.originalImageWidth = img.offsetWidth;
			_image.originalImageHeight = img.offsetHeight;
				
			if (!img.getAttribute("data-ghostedit-nativewidth")) img.setAttribute("data-ghostedit-nativewidth", img.offsetWidth);
			if (!img.getAttribute("data-ghostedit-nativeheight")) img.setAttribute("data-ghostedit-nativeheight", img.offsetHeight);
			
			ghostedit.util.addEvent(document.body, "mousemove", _image.resize.handle);
			ghostedit.util.addEvent(document.body, "mouseup", _image.resize.end);
			ghostedit.util.addEvent(window, "blur", _image.resize.end);
			//document.body.onmousemove = function(event){return _image.resize.handle(event);};
			//document.body.onmouseup = function(event){return _image.resize.end(event);};
			return false;//stop image losing focus after resize in ie
		},
		
		handle: function (e) {
			var img, resizeHandle, alignbutton, curMouseX, curMouseY, newWidth, newHeight, origImageWidth, origImageHeight, origMouseX, origMouseY, nativeImageWidth, nativeImageHeight;
			e = window.event != null ? window.event : e;
			if (_image.focusedimage == null) {
				_image.unfocus ();
			}
			else {
				img = _image.focusedimage;
				resizeHandle = document.getElementById("ghostedit_image_resizehandle_" + img.id.replace("ghostedit_image_",""));
				alignbutton = document.getElementById("ghostedit_imagebutton_align" + img.id.replace("ghostedit_image_",""));
				
				// Get variables
				curMouseX = e.pageX || e.clientX + document.body.scrollLeft;
				curMouseY = e.pageY || e.clientY + document.body.scrollTop;
				
				origMouseX = _image.originalMouseX;
				origMouseY = _image.originalMouseY;
				
				origImageHeight = _image.originalImageHeight;
				origImageWidth = _image.originalImageWidth;
				
				nativeImageHeight = img.getAttribute("data-ghostedit-nativeheight");
				nativeImageWidth = img.getAttribute("data-ghostedit-nativewidth");			
				
				
				// Calculate new width and height
				if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
					newWidth = origImageWidth + (curMouseX - origMouseX);
					newHeight = origImageHeight + (curMouseY - origMouseY);
				}
				else {
					newWidth = origImageWidth - (curMouseX - origMouseX);
					newHeight = origImageHeight + (curMouseY - origMouseY);
				}
				
				
				if (((newHeight / nativeImageHeight) * nativeImageWidth) > newWidth) {
					newWidth = (newHeight / nativeImageHeight) *nativeImageWidth;
				}
				else {
					newHeight = (newWidth / nativeImageWidth) * nativeImageHeight;
				}
				
				// If new width is greater than editdiv width then make it the editdiv width
				if (newWidth >= img.parentNode.width) {
					newWidth = img.parentNode.width;
					newHeight = (newWidth / nativeImageWidth) * nativeImageHeight;
				}
				
				// Set image to new dimensions
				img.style.width = newWidth + "px";
				img.style.height = newHeight + "px";
				
				_image.ui.setbuttonpositions();
			}
		},
		
		end: function (e) {
			_image.justResized = true;
			//_image.resize.handle(e);
			//document.body.onmousemove = null;
			//document.body.onmouseup = null;
			ghostedit.util.removeEvent(document.body, "mousemove", _image.resize.handle);
			ghostedit.util.removeEvent(document.body, "mouseup", _image.resize.end);
			ghostedit.util.removeEvent(window, "blur", _image.resize.end);
			ghostedit.history.saveUndoState();
		}
	};
	
	_image.ui = {
		show: function (image) {
			
		},
		
		hide: function (image) {
				image = image || _image.focusedimage;
				
				if (!image) return false;
				
				// Remove image border
				if(document.getElementById("ghostedit_image_border_" + image.id.replace("ghostedit_image_",""))) {
					ghostedit.contextuallayer.removeChild(document.getElementById("ghostedit_image_border_" + image.id.replace("ghostedit_image_","")));
				}
				
				// Remove resize handle
				if(!ghostedit.options.image.disableresize && document.getElementById("ghostedit_image_resizehandle_" + image.id.replace("ghostedit_image_",""))) {
					ghostedit.contextuallayer.removeChild(document.getElementById("ghostedit_image_resizehandle_" + image.id.replace("ghostedit_image_","")));
				}
				
				//Remove image buttons
				for(i = 0; i < _image.buttons.length; i += 1) {
					_image.buttons[i].hide();
				}
				_image.buttons = [];
				
				// Disable image toolbar tab
				//if (ghostedit.uicontext === "image"){ ghostedit.ui.toolbar.showtab("format"); }
				//ghostedit.ui.toolbar.disabletab("image");
		},
		
		srcdialog: function () {
			if (_image.focusedimage != false) {
				//_image.focusedimage.alt = newalt;
				ghostedit.ui.modal.show("<h3>Change Image Source</h3>" + 
				"yada yada");
			}
		},
		
		createbutton: function (imgIdNum, name, html, positionfunc) {
			var button, elem;
			
			// Create button element
			elem =  document.createElement("span");
			elem.id = "ghostedit_imagebutton_" + name + "_" + imgIdNum;
			elem.setAttribute("data-ghostedit-elemtype","ghostedit_imagebutton");
			elem.setAttribute("data-ghostedit-handler","image");
			elem.className = "ghostedit_imagebutton"
			elem.innerHTML = html;"&#215;";//"<img src='/static/images/x.png' style='vertical-align: middle' />";
			
			// Create button object
			button = {
				elem: elem
			}
			
			button.reposition = positionfunc;
			
			button.event = {
				mousedown: function (event) { return ghostedit.util.cancelEvent(event); },
				dragstart: function (event) { return ghostedit.util.cancelEvent(event); },
				draggesture: function (event) { return ghostedit.util.cancelEvent(event); },
				click: function (event) { return ghostedit.util.cancelEvent(event); },
				dblclick: function (event) { return ghostedit.util.cancelEvent(event); },
				resizestart: function (event) { return ghostedit.util.cancelEvent(event); }
			}
			
			button.show = function (img) {
				ghostedit.contextuallayer.appendChild(button.elem);
				button.elem.style.MozUserSelect = 'none';
				button.elem.contentEditable = false;
				button.elem.unselectable = 'on';
				button.elem.onmousedown = button.event.mousedown;
				button.elem.ondragstart = button.event.dragstart;
				button.elem.ondraggesture = button.event.draggesture;
				button.elem.onclick = button.event.click;
				button.elem.ondblclick = button.event.dblclick;
				button.elem.onresizestart = button.event.resizestart;
			}
			
			button.hide = function () {
				button.elem.parentNode.removeChild(button.elem);
			}
			
			button.register = function () {
				_image.buttons.push(button);
			}
			
			return button;
		},
		
		setbuttonpositions: function () {
			var img, border, resizeHandle, deletebutton, alignbutton, upbutton, downbutton;
			if (img = _image.focusedimage) {
				
				//Position border
				border = document.getElementById("ghostedit_image_border_" + img.id.replace("ghostedit_image_",""));
				border.style.top = img.offsetTop + "px";
				border.style.left = img.offsetLeft + "px";
				border.style.width = (img.offsetWidth - 6) + "px";
				border.style.height = (img.offsetHeight - 6) + "px";
				
				// Position resize handle
				if(!ghostedit.options.image.disableresize) {
					resizeHandle = document.getElementById("ghostedit_image_resizehandle_" + img.id.replace("ghostedit_image_",""));
					resizeHandle.style.top = (img.offsetTop + img.offsetHeight - 13) + "px";
					if (img.style.cssFloat == "left" || img.style.styleFloat == "left") {
						resizeHandle.style.left = (img.offsetLeft + img.offsetWidth - 13) + "px";
					}
					else {
						resizeHandle.style.left = (img.offsetLeft) + "px";
					}
				}
				
				// Position image buttons
				for(i = 0; i < _image.buttons.length; i += 1) {
					_image.buttons[i].reposition(img, _image.buttons[i]);
				}
			}
		}
	};
	
	
	_image.insert = function () {
		var imageurlinput;
		imageurlinput = document.getElementById("ghostedit_imageurlinput");
		imageurlinput.blur();
		_image.newImageBefore (null, null, false);
		ghostedit.ui.modal.hide();
	};
	
	_image.insertInline = function (elem, srcURL, skipResize) {
		ghostedit.history.saveUndoState();
		ghostedit.selection.restore();
		if (elem == null) { elem = ghostedit.selection.savedRange.getStartNode(); }
		elem = ghostedit.textblock.selection.getTextBlockNode ( elem );
		
		if (srcURL == null) { srcURL = document.getElementById("ghostedit_imageurlinput").value; }


		if(document.createRange) {
			newImg = document.createElement("img");
			ghostedit.imgElemId += 1;
			newImg.id = 'ghostedit_image_' + (1000 + ghostedit.imgElemId);
			ghostedit.selection.savedRange.getNative().insertNode(newImg);
		}
		else if (document.selection) {
			ghostedit.selection.savedRange.getNative().pasteHTML("<img id='ghostedit_image_" + (1000 + ghostedit.imgElemId) + "' />");
		}
		
		var addedImage = document.getElementById('ghostedit_image_' + (1000 + ghostedit.imgElemId));
		addedImage.setAttribute("data-ghostedit-elemtype", "image");
		addedImage.setAttribute("data-ghostedit-handler", "image");
		addedImage.contentEditable = 'false';
		addedImage.unselectable = 'on';
		var that = {
			i: addedImage,
			s: skipResize
		}
		that.callself = function () {
			_image.onload(that.i, that.s, true)
		}
		addedImage.onload = that.callself;//function(img, skipResize){return _image.onload(img, skipResize, false)}(addedImage, skipResize);
		addedImage.src = srcURL;
		addedImage.onclick = function(e){_image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
		addedImage.ondragstart = function(event){
			event = window.event ? window.event : event;
			if (event.dataTransfer) {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("Text", addedImage.id);
			}
			return true;
			};
		addedImage.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
		addedImage.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
		addedImage.oncontrolselect = function(e){_image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
	};
	
	_image.create = function (srcURL) {
		var newimg;
		
		// Create image element and set id
		newimg = document.createElement("img");
		_image.elemid += 1;
		newimg.id = 'ghostedit_image_' + _image.elemid;
		
		// Set basic attributes
		newimg.src = srcURL; //set source after adding to DOM otherwise onload is not fired in IE (no longer using onload event)
		if (ghostedit.options.defaultimageclass) newimg.className = ghostedit.options.defaultimageclass;
		newimg.setAttribute("data-ghostedit-elemtype", "image");
		newimg.setAttribute("data-ghostedit-handler", "image");
		
		// Prevent browser default image editing controls
		newimg.contentEditable = 'false';
		newimg.unselectable = 'on';
		newimg.galleryimg = 'no'; //hide IE image toolbar

		// Set drag and drop event handlers
		newimg.onclick = function(e) { _image.focus(this,e);ghostedit.util.cancelAllEvents(e); };
		newimg.ondragstart = function(event) {
			event = window.event ? window.event : event;
			if (event.dataTransfer) {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("Text", newimg.id);
			}
			return true;
			};
		newimg.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
		newimg.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
		newimg.oncontrolselect = function(e){_image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
		
		return newimg;
	};
	
	_image.newImageBefore = function (elem, srcURL, skipResize, wheretoinsert) {
		var that, addedImage, parent, handler, result;
		ghostedit.history.saveUndoState();
		if (elem == null) { elem = ghostedit.selection.savedRange.getStartNode(); }
		elem = ghostedit.textblock.selection.getTextBlockNode ( elem );
		if (wheretoinsert !== "after") wheretoinsert = "before";
		
		if (srcURL == null) { srcURL = document.getElementById("ghostedit_imageurlinput").value; }

		if (!document.getElementById("ghostedit_image_" + elem.id.replace("ghostedit_textblock_", ""))) {
			newImg = document.createElement("img");
			_image.elemid += 1;
			newImg.id = 'ghostedit_image_' + _image.elemid;
			if (ghostedit.options.defaultimageclass) newImg.className = ghostedit.options.defaultimageclass;
			//newImg.src = srcURL;//set source after adding to DOM otherwise onload is not fired in IE
			
			
			// Ask (ghost) parent to insert new element into page
			parent = ghostedit.dom.getParentGhostBlock(elem);
			handler = parent.getAttribute("data-ghostedit-handler");

			result = ghostedit.plugins[handler].dom.addchild (parent, wheretoinsert, elem, newImg);
			
			if (!result) return false;
		
			var addedImage = document.getElementById('ghostedit_image_' + _image.elemid);
			
			// Set attributes and dom events
			addedImage.setAttribute("data-ghostedit-elemtype", "image");
			addedImage.setAttribute("data-ghostedit-handler", "image");
			addedImage.contentEditable = 'false';
			addedImage.unselectable = 'on';
			addedImage.galleryimg = 'no'; //hide IE image toolbar
			var clearval = (elem.style.clear == 'left') ? 'right' : 'left';
			addedImage.style.cssFloat = clearval;
			addedImage.style.styleFloat = clearval;
			addedImage.style.clear = elem.style.clear;
			addedImage.style.marginRight = '20px';
			var that = {
				i: addedImage,
				s: skipResize
			}
			that.callself = function () {
				_image.onload(that.i, that.s, true)
			}
			addedImage.onload = that.callself;//function(img, skipResize){return _image.onload(img, skipResize, false)}(addedImage, skipResize);
			addedImage.src = srcURL;
			_image.applyeventlisteners(addedImage);
			
			ghostedit.util.addClass(addedImage, "leftimage");
			
			//document.getElementById('ghostedit_image_' + elem.id).style.width = '200px';
			//document.getElementById('ghostedit_image_' + elem.id).style.height = '299px';
			//document.getElementById('block_' + elem.id).style.width = (486 - document.getElementById('ghostedit_image_' + elem.id).style.width.replace("px","") - 30) + "px";
			
			return addedImage;
		}
	};
	
	_image.newImageFrame = function () { /* LEGACY, DO NOT USE */
		var that, addedImage;
		ghostedit.history.saveUndoState();
		elem = ghostedit.selection.savedRange.getStartNode();
		elem = ghostedit.textblock.selection.getTextBlockNode ( elem );
		
		if(!elem || !elem.id) {
			ghostedit.ui.message.show("Please select a paragraph or heading before trying to insert an image.", 2, "error");
			return false;
		}
		
		if (!document.getElementById("ghostedit_image_" + elem.id.replace("ghostedit_textblock_", ""))) {
			newImg = document.createElement("div");
			newImg.innerHTML = "<h3>Image Uploading</h3>";
			newImg.id = 'ghostedit_image_' + elem.id.replace("ghostedit_textblock_", "");
			//newImg.src = srcURL;set source afdowns otherwise onload is not fired in IE
		
			if (elem.parentNode != null) {
				elem.parentNode.contentEditable = false;
				elem.parentNode.insertBefore(newImg, elem);
				elem.parentNode.contentEditable = true;
			}
			else {
				ghostedit.ui.message.show("Please select a paragraph or heading before trying to insert an image.", 2, "error");
			}
			var addedImage = document.getElementById('ghostedit_image_' + elem.id.replace("ghostedit_textblock_", ""));
			addedImage.setAttribute("data-ghostedit-elemtype","image");
			addedImage.setAttribute("data-ghostedit-handler","image");
			addedImage.contentEditable = 'false';
			addedImage.unselectable = 'on';
			addedImage.style.width = '240px';
			addedImage.style.height = '160px';
			addedImage.style.backgroundColor = '#EEE';
			addedImage.style.cssFloat = 'left';
			addedImage.style.styleFloat = 'left';
			addedImage.style.marginRight = '20px';
			addedImage.style.overflow = 'hidden';
			addedImage.setAttribute("data-ghostedit-nativewidth", 0);
			addedImage.setAttribute("data-ghostedit-nativeheight", 0);
			addedImage.onclick = function(e){_image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
			addedImage.ondragstart = function(event){
				event = window.event ? window.event : event;
				if (event.dataTransfer) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setData("Text", addedImage.id);
				}
				return true;
				};
			addedImage.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
			addedImage.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
			addedImage.oncontrolselect = function(e){_image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
			return addedImage.id;
			//document.getElementById('ghostedit_image_' + elem.id).style.width = '200px';
			//document.getElementById('ghostedit_image_' + elem.id).style.height = '299px';
			//document.getElementById('block_' + elem.id).style.width = (486 - document.getElementById('ghostedit_image_' + elem.id).style.width.replace("px","") - 30) + "px";
		}
	};
	
	_image.onload = function ( img, skipResize, hasWaited ) {
		if (hasWaited == true) {
			img.setAttribute("data-ghostedit-nativewidth", 0);
			img.setAttribute("data-ghostedit-nativeheight", 0);
			if (!ghostedit.options.image.disableresize && !skipResize && img.offsetWidth > 200) {
				var newWidth = 200;
				var newHeight = (newWidth / img.offsetWidth) * img.offsetHeight;
				img.style.width = newWidth + "px";
				img.style.height = newHeight + "px";
			}
			img.contentEditable = false;
			ghostedit.history.saveUndoState();
		}
		else {
			var that = {
				i: img,
				s: skipResize
			}
			that.callself = function () {
				_image.onload(that.i, that.s, true)
			}
			setTimeout(that.callself, 20);
		}
	};
	
	_image.applyeventlisteners = function () {
		var imgs, i, image;
		imgs = ghostedit.editdiv.getElementsByTagName("img");
		for (i = 0; i < imgs.length; i++) {
			image = imgs[i];
			if (image.getAttribute("data-ghostedit-elemtype") !== "image") continue;
			image.onclick = function(e){_image.focus(this,e);ghostedit.util.cancelAllEvents(e);};
			image.ondragstart = function(event){
				event = window.event ? window.event : event;
				if (event.dataTransfer) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setData("Text", addedImage.id);
				}
				return true;
				};
			image.ondraggesture = function(){return ghostedit.util.cancelEvent(e)};
			image.onresizestart = function(){return ghostedit.util.cancelAllEvents(e)};
			image.oncontrolselect = function(e){_image.focus(this,e);return ghostedit.util.cancelAllEvents(e)};
		}
	};
	
	ghostedit.api.plugin.register ("image", _image);
})(window);
