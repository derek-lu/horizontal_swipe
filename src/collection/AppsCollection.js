/**
 * Collection that represents the apps.
 */

var ADOBE = ADOBE || {};

ADOBE.AppsCollection = Backbone.Collection.extend({
	initialize: function() {
		this.url = ADOBE.AppsCollection.url;
	},
	
	parse: function(xml) {
		var appNodes = xml.getElementsByTagName("app");
		var len = appNodes.length;
		if (len > 0) {
			var apps = [];
			for (var i = 0; i < len; i++) {
				var appNode = appNodes[i];
				var app = {};
				app.index = i;
				// Loop through the nodes of the app.
				var childNodes = appNode.childNodes;
				var numNodes = childNodes.length;
				for (var j = 0; j < numNodes; j++) {
					var childNode = childNodes[j];
					if (childNode.nodeType == 1) {
						var nodeName = childNode.nodeName;
						app[nodeName] = childNode.firstChild.nodeValue;
					}
				}
				
				apps.push(app);
			}
			
			return apps;
		}
		else
		{
			return null;
		}
	}
});
