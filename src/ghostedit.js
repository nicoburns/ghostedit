(function(window, undefined) {
	// Create ghostedit object and global variables
	var _ghostedit = {
		version: "1.0rc1",
		enabledplugins: [],
		uicontext: "",
		active: false,
		isEditing: true,
		blockElemId: 0,
		editorchrome: null,
		debug: false
	};
	
	// Empty api object for plugins and init functions to add to
	_ghostedit.api = {};
	
	// Empty object for plugins to be stored in
	_ghostedit.plugins = {};
	
	// Add the ghostedit object to the global namespace
	window.ghostedit = _ghostedit;
})(window);