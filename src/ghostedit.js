(function(window, undefined) {
	// Create ghostedit object and global variables
	var _ghostedit = {
		version: "1.0pre",
		enabledplugins: [],
		ready: false,
		active: false,
		isEditing: true,
		blockElemId: 0,
		editorchrome: null,
		debug: false
	};
	
	// Empty object for references to any elements which need to be globally accesable to be stored on
	_ghostedit.el = {};
	
	// Empty api object for plugins and init functions to add to
	_ghostedit.api = {};
	
	// Empty object for plugins to be stored in
	_ghostedit.plugins = {};
	
	// Add the ghostedit object to the global namespace
	window.ghostedit = _ghostedit;
})(window);