/**
 * Collection that represents the specials.
 * Filters out the magazines by not including any folio with a month in the issueNumber.
 */

var ADOBE = ADOBE || {};

ADOBE.SpecialsCollection = Backbone.Collection.extend({
	months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	
	initialize: function(models, options) {
		this.url = ADOBE.SpecialsCollection.url;
		
		if (ADOBE.isAPIAvailable) {
			var totalMonths = this.months.length;
			var startIndex = models.length;
			for (var i = startIndex - 1; i >= 0; i--) {
				var isSpecial = true;
				var folioNumber = models[i].folioNumber.toLowerCase();
				
				// Include the special issues only. A special issue is any issue without a month in the folioNumber field.
				for (var j = 0; j < totalMonths; j++) {
					if (folioNumber.indexOf(this.months[j].toLowerCase()) != -1) {
						isSpecial = false;
						break;
					}
				}
				
				if (isSpecial) {
					var folio = models[i];
					for (var prop in folio) {
						if (prop == "publicationDate") {
							var pubDate = folio[prop];
							folio.dateLabel = this.months[pubDate.getMonth()] + " " + pubDate.getFullYear();
						}
					}
				} else { // Remove the models which aren't special folios.
					models.splice(i, 1);
				}
			}
		}
	},
	
	parse: function(xml) {
		var totalMonths = this.months.length;
		var issueNodes = xml.getElementsByTagName("issue");
		var len = issueNodes.length;
		if (len > 0) {
			var issues = [];
			for (var i = 0; i < len; i++) {
				var issueNode = issueNodes[i];
				// Get the attributes
				var issue = {};
				var attributes = issueNode.attributes;
				issue.id = attributes.getNamedItem("id").value;
				issue.productId = attributes.getNamedItem("productId").value;
				issue.formatVersion = attributes.getNamedItem("formatVersion").value;
				issue.version = attributes.getNamedItem("version").value;
				issue.subpath = attributes.getNamedItem("subpath").value;
				
				// Loop through the nodes.
				var childNodes = issueNode.childNodes;
				var numNodes = childNodes.length;
				for (var j = 0; j < numNodes; j++) {
					var childNode = childNodes[j];
					if (childNode.nodeType == 1) {
						var nodeName = childNode.nodeName;
						if (nodeName == "libraryPreviewUrl") {
							issue[nodeName] = $.trim(childNode.firstChild.nodeValue);
						} else if (childNode.nodeName == "publicationDate") {
							// 2011-06-22T07:00:00Z.
							var pubDate = childNode.firstChild.nodeValue.split("-");
							var date = new Date(pubDate[0], Number(pubDate[1]) - 1, pubDate[2].substr(0, 2));
							issue[nodeName] = date;
						} else if (childNode.nodeName == "issueNumber") { // Make the property match the API.
							issue["folioNumber"] = childNode.firstChild.nodeValue;
						} else {
							issue[nodeName] = childNode.firstChild.nodeValue;
						}
					}
				}
				
				// Include the special issues only. A special issue is any issue without a month in the issueNumber field.
				var issueNumber = issue.folioNumber.toLowerCase();
				var isSpecial = true;
				for (var j = 0; j < totalMonths; j++) {
					if (issueNumber.indexOf(this.months[j].toLowerCase()) != -1) {
						isSpecial = false;
						break;
					}
				}
				
				if (isSpecial)
					issues.push(issue);
			}
			
			issues.sort(this.sortDatesDescending);

			return issues;
		}
		else
		{
			return null;
		}
	},
	
	// Returns a folio based on productId.
	getByProductId: function(productId) {
		var len = this.length;
		for (var i = 0; i < len; i++) {
			if (this.at(i).attributes.productId == productId)
				break;
		}
		
		return this.at(i);
	},
	
	sortDatesDescending: function (a, b) {
		if (a.publicationDate < b.publicationDate)
			return 1;
		else if (a.publicationDate > b.publicationDate)
			return -1;
		else
			return 0;
	}
});
