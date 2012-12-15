(function (window, undefined) {
	
	var _save = {
		savename: "",
		saveurl: "",
		params: []
	},
	ghostedit = window.ghostedit;
	
	_save.enable = function () {
		var i, params, param;
		
		//Export api functions
		ghostedit.api.save = function () { _save.save(); };
		
		if (ghostedit.options.save && ghostedit.options.save.params) {
			params = ghostedit.options.save.params;
			for (i = 0; i < params.length; i++) {
				if (typeof params[i] !== "string") continue;
				param = params[i].split("=", 2);
				if (param.length > 1) {
					_save.updateparameter (param[0], param[1]);
				}
			}
		}
	};
	
	_save.save = function () {
		//Declare variables
		var i , finalCode, params, handleResult;
		
		// Get HTML to be saved, and add it to the parameters		
		finalCode = ghostedit.api.exportHTML();
		_save.updateparameter ("snippet", finalCode.snippet);
		_save.updateparameter ("content", finalCode.content);

		// Collapse parameters array into a string
		params = [];
		for (i = 0; i < _save.params.length; i++) {
			params.push(_save.params[i].name + "=" + _save.params[i].value);
		}
		params = params.join("&");
		
		// Define function to handle the server response
		handleResult = function(success, response){
			var msg;
			if (success && response === "true") {
				ghostedit.event.trigger("ui:message", {message: "Page was successfully saved :)", time: 1, color: "success"});
			}
			else {
				//msg = success ? "There was an error saving this page - try a <a href='' onclick='savePage()'>hard save</a>." : "Page could not be saved, make sure you are connected to the internet and try again";
				msg = response;
				ghostedit.event.trigger("ui:message", {message: msg, time: 1, color: "error"});
			}
		};
		
		// Send ajax request
		ghostedit.util.ajax(ghostedit.options.save.url, "POST", params, handleResult, "text");
	};
	
	_save.updateparameter = function (name, value) {
		var i;
		if (typeof name !== "string" || typeof value !== "string") return;
		
		// Sanitize name and value
		name = name.replace(/[^A-Za-z\-_0-9]/g, "");
		value = encodeURIComponent(value);
		
		// If parameter with name 'name' already exists, update it
		for (i = 0; i < _save.params.length; i++) {
			if (_save.params[i].name === name) {
				_save.params[i] = {"name": name, "value": value};
				return;
			}
		}
		
		// Else add new parameter to list
		_save.params.push({"name": name, "value": value});
	};

	ghostedit.api.plugin.register("save", _save);
})(window);