(function(window, undefined) {
	
	var _dom = {};
	
	_dom.getNodeOffset = function (node) {
		var offset, nodelist;
		
		if (!node || !node.parentNode) return;
		
		offset = 0;
		nodelist = node.parentNode.childNodes;
		
		while (nodelist[offset] !== node) {
			offset += 1;
		}
		return offset;
	};

	_dom.extractContent = function (node) {
		var frag = document.createDocumentFragment(), child;
		while ( (child = node.firstChild) ) {
			frag.appendChild(child);
		}
		return frag;
	};

	_dom.cloneContent = function (node) {
		var frag = document.createDocumentFragment(), child;
		for (i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes[i];
			frag.appendChild(child.cloneNode(true));
		}
		return frag;
	};

	_dom.parse = function (node, rules) {
		var parsednode = false, nodes, parsedchild, nodetype, i, j, value, text, tagname, tagrules, attribute, style;
		if (!node || !rules || !node.nodeType) return false;
		
		rules.textnode = rules.textnode || {};
		rules.tags = rules.tags || {};
		
		// Handle textnodes
		if (node.nodeType === 3) {
			text = (rules.textnode.clean) ? node.nodeValue.replace(/[\n\r\t]/g,"") : node.nodeValue;
			return (text.length > 0) ? document.createTextNode(text) : false;
		}
		
		// Handle not-element case (textnodes already handled)
		if (node.nodeType !== 1) return false;
		
		// Get rules for tag, if none default to content only
		tagname = node.tagName.toLowerCase();
		tagrules = {"contentsonly": true};
		if (rules.tags[tagname]) {
			tagrules = rules.tags[tagname];
			if (typeof tagrules.template === "string") tagrules = tagrules.template;
			if (typeof tagrules === "string" && rules.templates[tagrules]) tagrules = rules.templates[tagrules];
			if (typeof tagrules === "string") return false;
		}
		
		
		// If "contentsonly" flag set, create document fragment, else create element of same type as node
		parsednode = tagrules.contentsonly ? document.createDocumentFragment() : document.createElement(node.tagName.toLowerCase());
		
		// Unless "ignorechildren" flag set, recurse on children
		if (!tagrules.ignorechildren) {
			nodes = node.childNodes;
			for (i = 0; i < nodes.length; i++) {
				if (parsedchild = _dom.parse(nodes[i], rules)) {
					parsednode.appendChild(parsedchild);
				}
			}
		}
		
		// Return here if contents only (no need to copy attributes if no node to copy to)
		if (tagrules.contentsonly) return (parsednode.childNodes.length > 0) ? parsednode : false;
		
		// If attributes specified, copy specified attributes
		if (tagrules.attributes) {
			for (i = 0; i < tagrules.attributes.length; i++) {
				attribute = tagrules.attributes[i];
				
				// Handle simple (no rules) case
				if (typeof attribute === "string") { attribute = {"name": attribute} }
				
				// Get value of attribute on source node
				if (typeof attribute.name !== "string") break;
				value  = attribute.value || (attribute.name === "class") ? node.className : node.getAttribute(attribute.name);
				if (value === undefined) break;
				attribute.copy = true;
				
				// If allowedvalues are specified, check if value is correct
				if (attribute.allowedvalues) {
					attribute.copy = false;
					for (j = 0; j < attribute.allowedvalues.length; j++) {
						if (attribute.allowedvalues[i] === value){
							attribute.copy = true;
							break;
						}
					}
				}
				
				// If all checks passed, set attribute on new node
				if (attribute.copy) {
					if (attribute.name === "class") {
						parsednode.className = value;
					}
					else {
						parsednode.setAttribute(attribute.name, value);
					}
				}
			}
		}
		
		
		// If styles specified, copy specified attributes
		if (tagrules.styles) {
			for (i = 0; i < tagrules.styles.length; i++) {
				style = tagrules.styles[i];
				
				// Handle simple (no rules) case
				if (typeof style === "string") { style = {"name": style} };
				
				// Get value of style on source node
				if (typeof style.name !== "string") break;
				if (style.name === "float") style.name = (node.style["cssFloat"]) ? "cssFloat" : "styleFloat";
				value  = style.value || node.style[style.name];
				if (value === undefined) break;
				style.copy = true;
				
				// If allowedvalues are specified, check if value is correct
				if (style.allowedvalues) {
					style.copy = false;
					for (j = 0; j < style.allowedvalues.length; j++) {
						if (style.allowedvalues[j] === value) {
							style.copy = true;
							break;
						}
					}
				}
				
				// If all checks passed, set style on new node
				if (style.copy) parsednode.style[style.name] = value;
			}
		}
		
		return parsednode;
	};

	_dom./*compareNodes = function (node1, node2) {
		var node;
		
		// If node1 is a documentFragment, wrap in an element
		if (n1.nodeType === 11) {
			node = document.createElement("div");
			node.appendChild(nodeOrFrag);
			node1 = node;
		}
		
		// If node2 is a documentFragment, wrap in an element
		if (n2.nodeType === 11) {
			node = document.createElement("div");
			node.appendChild(nodeOrFrag);
			node2 = node;
		}
		
		function getNextNode (nodelist, current) {
			
		}
		
		nodes1 = node1.getElementsByTagName(*);
		
		
	},*/
	
	isGhostBlock = function (node) {
		if (!node || !node.nodeType || node.nodeType !== 1) return false;
		
		var ghosttype = node.getAttribute("data-ghostedit-elemtype");
		
		return (ghosttype !== undefined && ghosttype !== false && ghosttype !== null) ? true : false; 
	};

	_dom.isChildGhostBlock = function (elem, parent) {
		if (!elem || !parent || !parent.childNodes) return false;
		if (elem.nodeType != 1) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === undefined) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === false) return false;
		if (elem.getAttribute("data-ghostedit-elemtype") === null) return false;
		var childblocks = parent.childNodes;
		for(i = 0; i < childblocks.length; i += 1) {
			if (elem === childblocks[i]) {
				return true;
			}
		}
		return false;
	};

	_dom.isGhostToplevel = function (node) {
		return (node && node.getAttribute("data-ghostedit-isrootnode") === true) ? true : false;
	};

	_dom.getParentGhostBlock = function (node) {
		
		if (!node) return false;
		
		do {
			node = node.parentNode;
			if (node == null) return false;
		}
		while (!_dom.isGhostBlock(node));
		
		return node;
	};

	_dom.getFirstChildGhostBlock = function (node) {
		var children;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse forwards through DOM until first GhostBlock is found.
		children = node.childNodes;
		
		for (i = 0; i < children.length; i += 1) {
			if (_dom.isGhostBlock(children[i])) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getLastChildGhostBlock = function (node) {
		var children;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
		children = node.childNodes;
		
		for (i = children.length -1; i >= 0; i -= 1) {
			if (_dom.isGhostBlock(children[i])) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getPreviousSiblingGhostBlock = function (node) {
		var parent, offset, siblings;
		
		if (!node || !node.parentNode) return false;			
		
		// Otherwise, recurse backwards through DOM until previous GhostBlock is found.
		parent = node.parentNode;
		offset = _dom.getNodeOffset (node) - 1;
		siblings = parent.childNodes;
		
		do {
			if (_dom.isGhostBlock(siblings[offset]) === true)  {
				return siblings[offset];
			}
			offset -= 1;
		}
		while (offset >= 0);
		
		return false;
	};

	_dom.getNextSiblingGhostBlock = function (node) {
		var parent, offset, siblings;
		
		if (!node || !node.parentNode) return false;			
		
		// Otherwise, recurse forwards through DOM until next GhostBlock is found.
		parent = node.parentNode;
		offset = _dom.getNodeOffset (node) + 1;
		siblings = parent.childNodes;
		
		do {
			if (_dom.isGhostBlock(siblings[offset]) === true)  {
				return siblings[offset];
			}
			offset += 1;
		}
		while (offset < siblings.length);
		
		return false;
	};

	_dom.getParentElement = function (node) {
		if (node.nodeType != 1) {
			while (node.nodeType != 1) {
				node = node.parentNode;
				if (node == null) return null;
			}
		}
		return node;
	};

	_dom.isDescendant = function (parent, child) {
	     var node = child.parentNode;
	     while (node != null) {
	         if (node == parent) {
	             return true;
	         }
	         node = node.parentNode;
	     }
	     return false;
	};

	_dom.getFirstChildElement = function (node) {
		var children;
		
		if (!node || !node.childNodes) return false;			
		
		// Otherwise, recurse forwards through DOM until next element is found.
		children = node.childNodes;
		
		for (i = 0; i < children.length; i += 1) {
			if (children[i].nodeType === 1) {
				return children[i];
			}
		}
		
		return false;
	};

	_dom.getCertainParent = function (condition, elem) {
		var args = [].slice.call(arguments);
		args.shift();
		if (!condition.apply(this, args)) {
			while (!condition.apply(this, args)) {
				elem = elem.parentNode;
				args[0] = elem;
				if (elem == null) return false;
			}
		}
		return elem;
	};
	
	window.ghostedit.dom = _dom;
})(window);