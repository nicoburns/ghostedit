(function (window, undefined) {

	var _plugins = {},
	ghostedit = window.ghostedit;
	
	_plugins.register = function(name, object) {
		if (ghostedit.plugins[name]) return false;
		
		ghostedit.plugins[name] = object;
		
		return true;
	};
	
	_plugins.enable = function (name) {
		if (!ghostedit.plugins[name]) return false;
		if (ghostedit.enabledplugins[name]) _plugins.disable(name);
		
		var plugin = ghostedit.plugins[name];
		if (typeof(plugin.enable) === "function") {
			plugin.enable();
		}
		ghostedit.enabledplugins[name] = true;
	};
	
	_plugins.disable = function (name) {
		if (!ghostedit.enabledplugins[name] || !ghostedit.plugins[name]) return false;
		
		var plugin = ghostedit.plugins[name];
		if (typeof(plugin.disable) === "function") {
			plugin.disable();
		}
		ghostedit.enabledplugins[name] = false;
	};
	
	window.ghostedit.api.plugin = _plugins;
})(window);