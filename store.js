/**
 * Collection that represents the magazines.
 * Filters out the specials.
 */

var ADOBE = ADOBE || {};

ADOBE.MagazinesCollection = Backbone.Collection.extend({
	months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	
	initialize: function(models, options) {
		this.url = ADOBE.MagazinesCollection.url;
		
		if (ADOBE.isAPIAvailable) {
			var totalMonths = this.months.length;
			var startIndex = models.length;
			for (var i = startIndex - 1; i >= 0; i--) {
				var isSpecial = true;
				var folioNumber = models[i].folioNumber.toLowerCase();
				
				// Include the issues which are not specials. A special issue is any issue without a month in the folioNumber field.
				for (var j = 0; j < totalMonths; j++) {
					if (folioNumber.indexOf(this.months[j].toLowerCase()) != -1) {
						isSpecial = false;
						break;
					}
				}
				
				if (!isSpecial) {
					var folio = models[i];
					for (var prop in folio) {
						if (prop == "publicationDate") {
							var pubDate = folio[prop];
							folio.dateLabel = this.months[pubDate.getMonth()] + " " + pubDate.getFullYear();
						}
					}
				} else { // Remove the models which are special folios.
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
				
				// Remove the special issues. A special issue is any issue without a month in the issueNumber field.
				var issueNumber = issue.folioNumber.toLowerCase();
				var isSpecial = true;
				for (var j = 0; j < totalMonths; j++) {
					if (issueNumber.indexOf(this.months[j].toLowerCase()) != -1) {
						isSpecial = false;
						break;
					}
				}
				
				if (!isSpecial)
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
/**
 * Used on the first page of MagazinesView and SpecialsView.
 * Displays each individual folio thumbnail and associated text and buy button on the first page below the featured folio.
 */
var ADOBE = ADOBE || {};

ADOBE.FolioItemPageOneView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folioPageOne",
	
	// The dialog asking whether or not to update the folio if an update is available.
	updateDialog: null,
	
	isTrackingTransaction: false,
	
	// A reference to the current downloadTransaction. Used to pause and resume a download.
	currentDownloadTransaction: null,
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	isBuyButtonEnabled: true,

	template: _.template("<img class='preview' width='111' height='148' /><div id='issueNumber'><p><%= folioNumber %><span class='purchaseState'></span></p></div><div class='buyButton'></div>"),
	
	render: function() {
		var json = this.model.toJSON();
		this.$el.html(this.template(json));
		
		if (ADOBE.isAPIAvailable) {
			//Get a reference to the original folio object.
			this.folio = adobeDPS.libraryService.folioMap.internal[this.model.attributes.id];
			
			// Load the preview image.
			var transaction = this.folio.getPreviewImage(111, 148, true);
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
					this.$el.find(".preview").attr("src", transaction.previewImageURL);
				}
			}, this);
			
			this.$el.find(".preview").attr("productId", this.folio.productId);

			this.updateBuyButtonLabel();

			// Add the handlers for the buttons.
			var scope = this;
			this.$el.on("click", ".buyButton", function() { scope.buyButton_clickHandler() });
			this.$el.on("click", "#download-toggle", function() { scope.downloadToggleButton_clickHandler() });
			
			// Add a handler to listen for updates.
			this.folio.updatedSignal.add(this.updatedSignalHandler, this);

			// Determine if the folio was in the middle of downloading.
			// If the folio is downloading then find the paused transaction and resume.
			if (this.folio.state == ADOBE.FolioStates.DOWNLOADING) {
				this.enableBuyButton(false);
				var transactions = this.folio.currentTransactions;
				var len = transactions.length;
				for (var i = 0; i < len; i++) {
					var transaction = transactions[i];
					if (transaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
						transaction.resume();
						break;
					}
				}
			}
		} else { // Testing on the desktop.
			this.$el.find(".preview").attr("src", json.libraryPreviewUrl);
			this.$el.find(".preview").attr("productId", json.productId);
			this.$el.find(".buyButton").html("<div class='black'>BUY<span class='price'>&nbsp;&nbsp;$1.99</span></div>");
		}
		
		return this;
	},
	
	updatedSignalHandler: function(properties) {
		this.updateBuyButtonLabel();
		
		// The buy button is disabled before downloading so if it is made viewable
		// during the download then enable it again. 
		if (properties.indexOf("isViewable") > -1 && this.folio.isViewable)
			this.enableBuyButton(true);
			
		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1) && this.folio.currentTransactions.length > 0)
			this.trackTransaction();
	},
	
	// Updates the label of the buy button and state based on folio.state.
	updateBuyButtonLabel: function() {
		var state = "";
		var label = "";
		switch (this.folio.state) {
			case ADOBE.FolioStates.INVALID:
				state = "Invalid";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.UNAVAILABLE:
				state = "Unavailable";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.PURCHASABLE:
				label = "<div class='black'>BUY<span class='price'>&nbsp;&nbsp;" + this.folio.price + "</span></div>";
				break;
			case ADOBE.FolioStates.ENTITLED:
				label = "<div class='blue'>DOWNLOAD</div>";
				break;
			case ADOBE.FolioStates.INSTALLED:
			case ADOBE.FolioStates.DOWNLOADING:
			case ADOBE.FolioStates.PURCHASING:
				label = "<div class='grey'>VIEW</div>";
				break;
			case ADOBE.FolioStates.EXTRACTING:
			case ADOBE.FolioStates.EXTRACTABLE:
				state = "Extracting";
				label = "<div class='grey'>VIEW</div>";
				break;
		}
		
		this.$el.find(".purchaseState").html(state);
		this.$el.find(".buyButton").html(label);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
	
		var transaction;
		for (var i = 0; i < this.folio.currentTransactions.length; i++) {
	        transaction = this.folio.currentTransactions[i];
	        if (transaction.isFolioStateChangingTransaction()) {
	            // found one, so break and attach to this one
	            break;
	        } else {
	            // null out transaction since we didn't find a traceable one
	            transaction = null;
	        }
	    }
	
		if (!transaction)
			return;

		var transactionType = transaction.jsonClassName;
		if (transactionType != "DownloadTransaction" &&
			transactionType != "UpdateTransaction" &&
			transactionType != "PurchaseTransaction" &&
			transactionType != "ArchiveTransaction" &&
			transactionType != "ViewTransaction") {
				return;
		}
		
		// Check if the transaction is active yet
		if (transaction.state == adobeDPS.transactionManager.transactionStates.INITALIZED) {
			// This transaction is not yet started, but most likely soon will
			// so setup a callback for when the transaction starts
			transaction.stateChangedSignal.addOnce(this.trackTransaction, this);
			return;
		}
		
		this.isTrackingTransaction = true;
		
		this.currentDownloadTransaction = null;
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction") {
			this.enableBuyButton(false);
			this.showDownloadStatus(true);
			this.setDownloadPercent(0);
			
			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
		} else {
			var state;
			if (transactionType == "PurchaseTransaction")
				state = "Purchasing...";
			else if (transactionType == "ArchiveTransaction")
				state = "Archiving...";
			else if (transactionType == "ViewTransaction")
				state = "Loading...";
			
			this.$el.find(".purchaseState").html(state);
			
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.$el.find(".purchaseState").html("");
				this.isTrackingTransaction = false;
			}, this)
		}
	},
	
	// Handler for when a user clicks the buy button.
	buyButton_clickHandler: function() {
		var state = this.folio.state;
		if (state == ADOBE.FolioStates.PURCHASABLE) {
			this.purchase();
		} else if (state == ADOBE.FolioStates.INSTALLED || this.folio.isViewable) {
			if (this.folio.isUpdatable)
				this.displayUpdateDialog();
			else
				this.folio.view();
		} else if (state == ADOBE.FolioStates.ENTITLED) {
			if (this.isBuyButtonEnabled)
				this.download();
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$el.find(".buyButton").css("opacity", value ? 1 : .6);
		
		this.isBuyButtonEnabled = value;
	},
	
	// Downloads the folio.
	download: function() {
		this.folio.download();
	},
	
	// Purchases the folio.
	purchase: function() {
		var transaction = this.folio.purchase();
		transaction.completedSignal.addOnce(function(transaction) {
			if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
				this.isTrackingTransaction = false;
				this.download();
			} else if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
				alert("Sorry, unable to purchase");
			}
			
			this.updateBuyButtonLabel();
		}, this);
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var desc = "An updated version of " + this.folio.title + " is available. Do you want to download this update now?";
		var html  = "<div id='updateDialogModalBackground' class='modalBackground'>"; // Make the dialog modal.
			html +=     "<div id='updateDialog' class='dialog'>";
			html += 	    "<p id='description'>" + desc + "</p>";
			html += 	    "<button id='no'>No</button><button id='yes'>Yes</button>";
			html +=     "</div>";
			html += "</div>";

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#updateDialog").addClass("pop");
		$("#updateDialogModalBackground").css("display", "inline");
		
		var scope = this;
		$("#updateDialog").on("click", "#no", function() { scope.no_updateDialogHandler() });
		$("#updateDialog").on("click", "#yes", function() { scope.yes_updateFolio() });
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.updateDialog.remove();
		this.folio.update();
		this.showDownloadStatus(true);
		this.setDownloadPercent(0);
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		this.folio.view();
	},
	
	// Downloads are automatically paused if another one is initiated so watch for changes with this callback.
	download_stateChangedSignalHandler: function(transaction) {
		if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
			alert("Unable to download folio.");
			this.download_completedSignalHandler(transaction);
		} else if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
			// Downloads do not resume from the last point so set the percent back to 0.
			this.setDownloadPercent(0);
			this.$el.find("#downloadToggle").addClass("downloadStatusRestart");
			this.$el.find("#downloadToggle").removeClass("downloadStatusClose");
		} else {
			this.$el.find("#downloadToggle").removeClass("downloadStatusRestart");
			this.$el.find("#downloadToggle").addClass("downloadStatusClose");
		}
	},
	
	// Updates the progress bar for downloads and updates.
	download_progressSignalHandler: function(transaction) {
		this.setDownloadPercent(transaction.progress);
	},
	
	// Handler for when a download or update completes.
	download_completedSignalHandler: function(transaction) {
		transaction.stateChangedSignal.remove(this.download_stateChangedSignalHandler, this);
		transaction.progressSignal.remove(this.download_progressSignalHandler, this);
		transaction.completedSignal.remove(this.download_completedSignalHandler, this);
			
		this.isTrackingTransaction = false;
		this.showDownloadStatus(false);
	},
	
	// User clicked the stop/restart button for the download.
	downloadToggleButton_clickHandler: function() {
		if (!this.currentDownloadTransaction)
			return;

		if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED)
			this.currentDownloadTransaction.resume();
		else
			this.currentDownloadTransaction.pause();
	},
	
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.downloadStatus) {
				var html  = "<div class='downloadStatus'>";
				    html +=    "<div class='progressTrack'><div class='progressBarLeft'/><div class='progressBarMiddle'/><div class='progressBarRight'/></div>";
				    html +=    "<div id='downloadToggle' class='downloadStatusClose'></div>";
				    html += "</div>";
				    
				this.downloadStatus = $(html);
				this.downloadStatus.insertAfter(this.$el.find(".preview"));
			}
		} else {
			if (this.downloadStatus) {
				this.downloadStatus.remove();
				this.downloadStatus = null;
			}
		}
	},
	
	setDownloadPercent: function(value) {
		value *= .01;
		var maxWidth = 73; // 73 is max width of track.
		this.$el.find(".progressBarMiddle").css("width", Math.min(Math.max(maxWidth * value, 0), maxWidth) - 8); //  subtract 4 for the left and 4 for the right
	}
});
/**
 * Used on pages after the first page in MagazinesView and SpecialsView.
 * Displays each individual folio thumbnail and associated text and buy button.
 */
var ADOBE = ADOBE || {};

ADOBE.FolioItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folio",
	
	// The dialog asking whether or not to update the folio if an update is available.
	updateDialog: null,
	
	isTrackingTransaction: false,
	
	// A reference to the current downloadTransaction. Used to pause and resume a download.
	currentDownloadTransaction: null,
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	isBuyButtonEnabled: true,

	template: _.template("<img class='preview' width='120' height='160' /><div id='issueNumber'><p><%= folioNumber %><span class='purchaseState'></span></p></div><div class='buyButton' ></div>"),
	
	render: function() {
		var json = this.model.toJSON();
		this.$el.html(this.template(json));

		if (ADOBE.isAPIAvailable) {
			//Get a reference to the original folio object.
			this.folio = adobeDPS.libraryService.folioMap.internal[this.model.attributes.id];
			
			// Load the preview image.
			var transaction = this.folio.getPreviewImage(120, 160, true);
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
					this.$el.find(".preview").attr("src", transaction.previewImageURL);
				}
			}, this);

			this.$el.find(".preview").attr("productId", this.folio.productId);
			
			this.updateBuyButtonLabel();
			
			// Add the handlers for the buttons.
			var scope = this;
			this.$el.on("click", ".buyButton", function() { scope.buyButton_clickHandler() });
			this.$el.on("click", "#download-toggle", function() { scope.downloadToggleButton_clickHandler() });
			
			// Add a handler to listen for updates.
			this.folio.updatedSignal.add(this.updatedSignalHandler, this);

			// Determine if the folio was in the middle of downloading.
			// If the folio is downloading then find the paused transaction and resume.
			if (this.folio.state == ADOBE.FolioStates.DOWNLOADING) {
				this.enableBuyButton(false);
				var transactions = this.folio.currentTransactions;
				var len = transactions.length;
				for (var i = 0; i < len; i++) {
					var transaction = transactions[i];
					if (transaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
						transaction.resume();
						break;
					}
				}
			}
		} else { // Testing on the desktop.
			this.$el.find(".preview").attr("src", json.libraryPreviewUrl);
			this.$el.find(".preview").attr("productId", json.productId);
			this.$el.find(".buyButton").html("<div class='black'>BUY<span class='price'>&nbsp;&nbsp;$1.99</span></div>");
		}
		
		return this;
	},
	
	updatedSignalHandler: function(properties) {
		this.updateBuyButtonLabel();
		
		// The buy button is disabled before downloading so if it is made viewable
		// during the download then enable it again. 
		if (properties.indexOf("isViewable") > -1 && this.folio.isViewable)
			this.enableBuyButton(true);
			
		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1) && this.folio.currentTransactions.length > 0)
			this.trackTransaction();
	},
	
	// Updates the label of the buy button and state based on folio.state.
	updateBuyButtonLabel: function() {
		var state = "";
		var label = "";
		switch (this.folio.state) {
			case ADOBE.FolioStates.INVALID:
				state = "Invalid";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.UNAVAILABLE:
				state = "Unavailable";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.PURCHASABLE:
				label = "<div class='black'>BUY<span class='price'>&nbsp;&nbsp;" + this.folio.price + "</span></div>";
				break;
			case ADOBE.FolioStates.ENTITLED:
				label = "<div class='blue'>DOWNLOAD</div>";
				break;
			case ADOBE.FolioStates.INSTALLED:
			case ADOBE.FolioStates.DOWNLOADING:
			case ADOBE.FolioStates.PURCHASING:
				label = "<div class='grey'>VIEW</div>";
				break;
			case ADOBE.FolioStates.EXTRACTING:
			case ADOBE.FolioStates.EXTRACTABLE:
				state = "Extracting";
				label = "<div class='grey'>VIEW</div>";
				break;
		}
		
		this.$el.find(".purchaseState").html(state);
		this.$el.find(".buyButton").html(label);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
	
		var transaction;
		for (var i = 0; i < this.folio.currentTransactions.length; i++) {
	        transaction = this.folio.currentTransactions[i];
	        if (transaction.isFolioStateChangingTransaction()) {
	            // found one, so break and attach to this one
	            break;
	        } else {
	            // null out transaction since we didn't find a traceable one
	            transaction = null;
	        }
	    }
	
		if (!transaction)
			return;

		var transactionType = transaction.jsonClassName;
		if (transactionType != "DownloadTransaction" &&
			transactionType != "UpdateTransaction" &&
			transactionType != "PurchaseTransaction" &&
			transactionType != "ArchiveTransaction" &&
			transactionType != "ViewTransaction") {
				return;
		}
		
		// Check if the transaction is active yet
		if (transaction.state == adobeDPS.transactionManager.transactionStates.INITALIZED) {
			// This transaction is not yet started, but most likely soon will
			// so setup a callback for when the transaction starts
			transaction.stateChangedSignal.addOnce(this.trackTransaction, this);
			return;
		}
		
		this.isTrackingTransaction = true;
		
		this.currentDownloadTransaction = null;
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction") {
			this.enableBuyButton(false);
			this.showDownloadStatus(true);
			this.setDownloadPercent(0);
			
			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
		} else {
			var state;
			if (transactionType == "PurchaseTransaction")
				state = "Purchasing...";
			else if (transactionType == "ArchiveTransaction")
				state = "Archiving...";
			else if (transactionType == "ViewTransaction")
				state = "Loading...";
			
			this.$el.find(".purchaseState").html(state);
			
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.$el.find(".purchaseState").html("");
				this.isTrackingTransaction = false;
			}, this)
		}
	},
	
	// Handler for when a user clicks the buy button.
	buyButton_clickHandler: function() {
		var state = this.folio.state;
		if (state == ADOBE.FolioStates.PURCHASABLE) {
			this.purchase();
		} else if (state == ADOBE.FolioStates.INSTALLED || this.folio.isViewable) {
			if (this.folio.isUpdatable)
				this.displayUpdateDialog();
			else
				this.folio.view();
		} else if (state == ADOBE.FolioStates.ENTITLED) {
			if (this.isBuyButtonEnabled)
				this.download();
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$el.find(".buyButton").css("opacity", value ? 1 : .6);
		
		this.isBuyButtonEnabled = value;
	},
	
	// Downloads the folio.
	download: function() {
		this.folio.download();
	},
	
	// Purchases the folio.
	purchase: function() {
		var transaction = this.folio.purchase();
		transaction.completedSignal.addOnce(function(transaction) {
			if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
				this.isTrackingTransaction = false;
				this.download();
			} else if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
				alert("Sorry, unable to purchase");
			}
			
			this.updateBuyButtonLabel();
		}, this);
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var desc = "An updated version of " + this.folio.title + " is available. Do you want to download this update now?";
		var html  = "<div id='updateDialogModalBackground' class='modalBackground'>"; // Make the dialog modal.
			html +=     "<div id='updateDialog' class='dialog'>";
			html += 	    "<p id='description'>" + desc + "</p>";
			html += 	    "<button id='no'>No</button><button id='yes'>Yes</button>";
			html +=     "</div>";
			html += "</div>";

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#updateDialog").addClass("pop");
		$("#updateDialogModalBackground").css("display", "inline");
		
		var scope = this;
		$("#updateDialog").on("click", "#no", function() { scope.no_updateDialogHandler() });
		$("#updateDialog").on("click", "#yes", function() { scope.yes_updateFolio() });
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.updateDialog.remove();
		this.folio.update();
		this.showDownloadStatus(true);
		this.setDownloadPercent(0);
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		this.folio.view();
	},
	
	// Downloads are automatically paused if another one is initiated so watch for changes with this callback.
	download_stateChangedSignalHandler: function(transaction) {
		if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
			alert("Unable to download folio.");
			this.download_completedSignalHandler(transaction);
		} else if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
			// Downloads do not resume from the last point so set the percent back to 0.
			this.setDownloadPercent(0);
			this.$el.find("#downloadToggle").addClass("downloadStatusRestart");
			this.$el.find("#downloadToggle").removeClass("downloadStatusClose");
		} else {
			this.$el.find("#downloadToggle").removeClass("downloadStatusRestart");
			this.$el.find("#downloadToggle").addClass("downloadStatusClose");
		}
	},
	
	// Updates the progress bar for downloads and updates.
	download_progressSignalHandler: function(transaction) {
		this.setDownloadPercent(transaction.progress);
	},
	
	// Handler for when a download or update completes.
	download_completedSignalHandler: function(transaction) {
		transaction.stateChangedSignal.remove(this.download_stateChangedSignalHandler, this);
		transaction.progressSignal.remove(this.download_progressSignalHandler, this);
		transaction.completedSignal.remove(this.download_completedSignalHandler, this);
			
		this.isTrackingTransaction = false;
		this.showDownloadStatus(false);
	},
	
	// User clicked the stop/restart button for the download.
	downloadToggleButton_clickHandler: function() {
		if (!this.currentDownloadTransaction)
			return;

		if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED)
			this.currentDownloadTransaction.resume();
		else
			this.currentDownloadTransaction.pause();
	},
	
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.downloadStatus) {
				var html  = "<div class='downloadStatus'>";
				    html +=    "<div class='progressTrack'><div class='progressBarLeft'/><div class='progressBarMiddle'/><div class='progressBarRight'/></div>";
				    html +=    "<div id='downloadToggle' class='downloadStatusClose'></div>";
				    html += "</div>";
				    
				this.downloadStatus = $(html);
				this.downloadStatus.insertAfter(this.$el.find(".preview"));
			}
		} else {
			if (this.downloadStatus) {
				this.downloadStatus.remove();
				this.downloadStatus = null;
			}
		}
	},
	
	setDownloadPercent: function(value) {
		value *= .01;
		var maxWidth = 82; // 82 is max width of track.
		this.$el.find(".progressBarMiddle").css("width", Math.min(Math.max(maxWidth * value, 0), maxWidth) - 8); //  subtract 4 for the left and 4 for the right
	}
});
/**
 * Displays the featured folio in the Magazines tab.
 */
var ADOBE = ADOBE || {};

ADOBE.FolioMarqueeItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "page0",
	
	// The dialog asking whether or not to update the folio if an update is available.
	updateDialog: null,
	
	isTrackingTransaction: false,
	
	// A reference to the current downloadTransaction. Used to pause and resume a download.
	currentDownloadTransaction: null,
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	isBuyButtonEnabled: true,
	
	initialize: function() {
		var html  = "<div id='featuredFolio'>";
			html +=		"<img class='preview' width='263' height='368'>"; 
			html +=		"<div id='issueNumberMagazines' class='issueNumber'></div><br>";
			html +=		"<div id='subscribeText'><em>Subscribe now.</em> Save up to 60% off the single issue price. Get each new issue automatically for just $12.99 per year or $1.99 per month.";
			html +=		"<p class='purchaseState'></p></div>";
			html +=		"<div class='row'>";
			html +=			"<div class='subscribeButton'></div>";
			html +=			"<div class='buyButton'></div>";
			html +=		"</div>";
			html +=		"<div id='printSubscribersTapHere'></div>";
			html +=		"<div id='tapCoversForContents'></div>";
			html +=		"<div id='nextArrow'></div>";
			html += "</div>";
			html += "<div id='thumbRow' class='row'></div>";
		    
		this.template = _.template(html);
	},
	
	render: function() {
		this.$el.html(this.template());
		
		if (ADOBE.isAPIAvailable) {
			//Get a reference to the original folio object.
			this.folio = adobeDPS.libraryService.folioMap.internal[this.model.attributes.id];
			
			// Load the preview image.
			var transaction = this.folio.getPreviewImage(263, 368, true);
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
					this.$el.find("#featuredFolio .preview").attr("src", transaction.previewImageURL);
				}
			}, this);
			
			this.$el.find("#featuredFolio .issueNumber").html(this.folio.folioNumber);
			this.$el.find("#featuredFolio .preview").attr("productId", this.folio.productId);
			
			this.updateBuyButtonLabel();
			
			// Add the handlers for the buttons.
			var scope = this;
			this.$el.on("click", "#featuredFolio .buyButton", function() { scope.buyButton_clickHandler() });
			this.$el.on("click", "#featuredFolio #downloadToggle", function() { scope.downloadToggleButton_clickHandler() });
			
			// Add a handler to listen for updates.
			this.folio.updatedSignal.add(this.updatedSignalHandler, this);
			
			// Determine if the folio was in the middle of downloading.
			// If the folio is downloading then find the paused transaction and resume.
			if (this.folio.state == ADOBE.FolioStates.DOWNLOADING) {
				this.enableBuyButton(false);
				var transactions = this.folio.currentTransactions;
				var len = transactions.length;
				for (var i = 0; i < len; i++) {
					var transaction = transactions[i];
					if (transaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
						transaction.resume();
						break;
					}
				}
			}
		} else {
			this.$el.find("#featuredFolio .issueNumber").html(this.model.attributes.folioNumber);
			this.$el.find("#featuredFolio img").attr("src", this.model.attributes.libraryPreviewUrl);
			this.$el.find("#featuredFolio .buyButton").html("<div class='black'>BUY<span class='price'>&nbsp;&nbsp;$1.99</span></div>");
			this.$el.find("#featuredFolio .preview").attr("productId", this.model.attributes.productId);
		}
		
		return this;
	},
	
	updatedSignalHandler: function(properties) {
		this.updateBuyButtonLabel();
		
		// The buy button is disabled before downloading so if it is made viewable
		// during the download then enable it again. 
		if (properties.indexOf("isViewable") > -1 && this.folio.isViewable)
			this.enableBuyButton(true);
			
		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1) && this.folio.currentTransactions.length > 0)
			this.trackTransaction();
	},
	
	// Updates the label of the buy button and state based on folio.state.
	updateBuyButtonLabel: function() {
		var state = "";
		var label = "";
		switch (this.folio.state) {
			case ADOBE.FolioStates.INVALID:
				state = "Invalid";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.UNAVAILABLE:
				state = "Unavailable";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.PURCHASABLE:
				label = "<div class='black'>BUY<span class='price'>&nbsp;&nbsp;" + this.folio.price + "</span></div>";
				break;
			case ADOBE.FolioStates.ENTITLED:
				label = "<div class='blue'>DOWNLOAD</div>";
				break;
			case ADOBE.FolioStates.INSTALLED:
			case ADOBE.FolioStates.DOWNLOADING:
			case ADOBE.FolioStates.PURCHASING:
				label = "<div class='grey'>VIEW</div>";
				break;
			case ADOBE.FolioStates.EXTRACTING:
			case ADOBE.FolioStates.EXTRACTABLE:
				state = "Extracting";
				label = "<div class='grey'>VIEW</div>";
				break;
		}
		
		this.$el.find("#featuredFolio .purchaseState").html(state);
		this.$el.find("#featuredFolio .buyButton").html(label);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
	
		var transaction;
		for (var i = 0; i < this.folio.currentTransactions.length; i++) {
	        transaction = this.folio.currentTransactions[i];
	        if (transaction.isFolioStateChangingTransaction()) {
	            // found one, so break and attach to this one
	            break;
	        } else {
	            // null out transaction since we didn't find a traceable one
	            transaction = null;
	        }
	    }
	
		if (!transaction)
			return;

		var transactionType = transaction.jsonClassName;
		if (transactionType != "DownloadTransaction" &&
			transactionType != "UpdateTransaction" &&
			transactionType != "PurchaseTransaction" &&
			transactionType != "ArchiveTransaction" &&
			transactionType != "ViewTransaction") {
				return;
		}
		
		// Check if the transaction is active yet
		if (transaction.state == adobeDPS.transactionManager.transactionStates.INITALIZED) {
			// This transaction is not yet started, but most likely soon will
			// so setup a callback for when the transaction starts
			transaction.stateChangedSignal.addOnce(this.trackTransaction, this);
			return;
		}
		
		this.isTrackingTransaction = true;
		
		this.currentDownloadTransaction = null;
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction") {
			this.enableBuyButton(false);
			this.showDownloadStatus(true);
			this.setDownloadPercent(0);

			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
		} else {
			var state;
			if (transactionType == "PurchaseTransaction")
				state = "Purchasing...";
			else if (transactionType == "ArchiveTransaction")
				state = "Archiving...";
			else if (transactionType == "ViewTransaction")
				state = "Loading...";
			
			this.$el.find("#featuredFolio .purchaseState").html(state);
			
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.$el.find("#featuredFolio .purchaseState").html("");
				this.isTrackingTransaction = false;
			}, this)
		}
	},
	
	// Handler for when a user clicks the buy button.
	buyButton_clickHandler: function() {
		var state = this.folio.state;
		if (state == ADOBE.FolioStates.PURCHASABLE) {
			this.purchase();
		} else if (state == ADOBE.FolioStates.INSTALLED || this.folio.isViewable) {
			if (this.folio.isUpdatable)
				this.displayUpdateDialog();
			else
				this.folio.view();
		} else if (state == ADOBE.FolioStates.ENTITLED) {
			if (this.isBuyButtonEnabled)
				this.download();
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$el.find("#featuredFolio .buyButton").css("opacity", value ? 1 : .6);
		this.isBuyButtonEnabled = value;
	},
	
	// Downloads the folio.
	download: function() {
		this.folio.download();
	},
	
	// Purchases the folio.
	purchase: function() {
		var transaction = this.folio.purchase();
		transaction.completedSignal.addOnce(function(transaction) {
			if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
				this.isTrackingTransaction = false;
				this.download();
			} else if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
				alert("Sorry, unable to purchase");
			}
			
			this.updateBuyButtonLabel();
		}, this);
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var desc = "An updated version of " + this.folio.title + " is available. Do you want to download this update now?";
		var html  = "<div id='updateDialogModalBackground' class='modalBackground'>"; // Make the dialog modal.
			html +=     "<div id='updateDialog' class='dialog'>";
			html += 	    "<p id='description'>" + desc + "</p>";
			html += 	    "<button id='no'>No</button><button id='yes'>Yes</button>";
			html +=     "</div>";
			html += "</div>";

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#updateDialog").addClass("pop");
		$("#updateDialogModalBackground").css("display", "inline");
		
		var scope = this;
		$("#updateDialog").on("click", "#no", function() { scope.no_updateDialogHandler() });
		$("#updateDialog").on("click", "#yes", function() { scope.yes_updateFolio() });
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.updateDialog.remove();
		this.folio.update();
		this.showDownloadStatus(true);
		this.setDownloadPercent(0);
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		this.folio.view();
	},
	
	// Downloads are automatically paused if another one is initiated so watch for changes with this callback.
	download_stateChangedSignalHandler: function(transaction) {
		if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
			alert("Unable to download folio.");
			this.download_completedSignalHandler(transaction);
		} else if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
			// Downloads do not resume from the last point so set the percent back to 0.
			this.setDownloadPercent(0);
			this.$el.find("#featuredFolio #downloadToggle").addClass("downloadStatusRestart");
			this.$el.find("#featuredFolio #downloadToggle").removeClass("downloadStatusClose");
		} else {
			this.$el.find("#featuredFolio #downloadToggle").removeClass("downloadStatusRestart");
			this.$el.find("#featuredFolio #downloadToggle").addClass("downloadStatusClose");
		}
	},
	
	// Updates the progress bar for downloads and updates.
	download_progressSignalHandler: function(transaction) {
		this.setDownloadPercent(transaction.progress);
	},
	
	// Handler for when a download or update completes.
	download_completedSignalHandler: function(transaction) {
		transaction.stateChangedSignal.remove(this.download_stateChangedSignalHandler, this);
		transaction.progressSignal.remove(this.download_progressSignalHandler, this);
		transaction.completedSignal.remove(this.download_completedSignalHandler, this);
			
		this.isTrackingTransaction = false;
		this.showDownloadStatus(false);
	},
	
	// User clicked the stop/restart button for the download.
	downloadToggleButton_clickHandler: function() {
		if (!this.currentDownloadTransaction)
			return;

		if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED)
			this.currentDownloadTransaction.resume();
		else
			this.currentDownloadTransaction.pause();
	},
	
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.downloadStatus) {
				var html  = "<div class='downloadStatus'>";
				    html +=    "<div class='progressTrack'><div class='progressBarLeft'/><div class='progressBarMiddle'/><div class='progressBarRight'/></div>";
				    html +=    "<div id='downloadToggle' class='downloadStatusClose'></div>";
				    html += "</div>";
				    
				this.downloadStatus = $(html);
				this.downloadStatus.insertBefore(this.$el.find("#featuredFolio #tapCoversForContents"));
			}
		} else {
			if (this.downloadStatus) {
				this.downloadStatus.remove();
				this.downloadStatus = null;
			}
		}
	},
	
	setDownloadPercent: function(value) {
		value *= .01;
		var maxWidth = 225; // 225 is max width of track.
		this.$el.find("#featuredFolio .progressBarMiddle").css("width", Math.min(Math.max(maxWidth * value, 0), maxWidth) - 8); //  subtract 4 for the left and 4 for the right
	}
});
/**
 * Displays the featured folio in the Specials tab.
 */
var ADOBE = ADOBE || {};

ADOBE.SpecialsFolioMarqueeItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "page0",
	
	// The dialog asking whether or not to update the folio if an update is available.
	updateDialog: null,
	
	isTrackingTransaction: false,
	
	// A reference to the current downloadTransaction. Used to pause and resume a download.
	currentDownloadTransaction: null,
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	isBuyButtonEnabled: true,
	
	initialize: function() {
		var html  = "<div id='featuredFolio'>";
			html +=		"<img class='preview' width='263' height='368'>"; 
			html +=		"<div id='issueNumberSpecials' class='issueNumber'></div><br>";
			html +=		"<div id='subscribeText'>Enjoy our FREE Going Green issue: A look at the best strategies for going green at home and in your local community.";
			html +=		"<p class='purchaseState'></p></div>";
			html +=		"<div class='row'>";
			html +=			"<div class='buyButton' ></div>";
			html +=		"</div>";
			html +=		"<div id='tapCoversForContents'></div>";
			html +=		"<div id='nextArrow'></div>";
			html += "</div>";
			html += "<div id='thumbRow' class='row'></div>";
		    
		this.template = _.template(html);
	},
	
	render: function() {
		this.$el.html(this.template());
		
		if (ADOBE.isAPIAvailable) {
			//Get a reference to the original folio object.
			this.folio = adobeDPS.libraryService.folioMap.internal[this.model.attributes.id];
			
			// Load the preview image.
			var transaction = this.folio.getPreviewImage(263, 368, true);
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
					this.$el.find("#featuredFolio .preview").attr("src", transaction.previewImageURL);
				}
			}, this);
			
			this.$el.find("#featuredFolio .issueNumber").html(this.folio.folioNumber);
			this.$el.find("#featuredFolio .preview").attr("productId", this.folio.productId);
			
			this.updateBuyButtonLabel();
			
			// Add the handlers for the buttons.
			var scope = this;
			this.$el.on("click", "#featuredFolio .buyButton", function() { scope.buyButton_clickHandler() });
			this.$el.on("click", "#featuredFolio #downloadToggle", function() { scope.downloadToggleButton_clickHandler() });
			
			// Add a handler to listen for updates.
			this.folio.updatedSignal.add(this.updatedSignalHandler, this);
			
			// Determine if the folio was in the middle of downloading.
			// If the folio is downloading then find the paused transaction and resume.
			if (this.folio.state == ADOBE.FolioStates.DOWNLOADING) {
				this.enableBuyButton(false);
				var transactions = this.folio.currentTransactions;
				var len = transactions.length;
				for (var i = 0; i < len; i++) {
					var transaction = transactions[i];
					if (transaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
						transaction.resume();
						break;
					}
				}
			}
		} else {
			this.$el.find("#featuredFolio .issueNumber").html(this.model.attributes.folioNumber);
			this.$el.find("#featuredFolio img").attr("src", this.model.attributes.libraryPreviewUrl);
			this.$el.find("#featuredFolio .buyButton").html("<div class='black'>BUY<span class='price'>&nbsp;&nbsp;$1.99</span></div>");
			this.$el.find("#featuredFolio .preview").attr("productId", this.model.attributes.productId);
		}
				
		return this;
	},
	
	updatedSignalHandler: function(properties) {
		this.updateBuyButtonLabel();
		
		// The buy button is disabled before downloading so if it is made viewable
		// during the download then enable it again. 
		if (properties.indexOf("isViewable") > -1 && this.folio.isViewable)
			this.enableBuyButton(true);
			
		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1) && this.folio.currentTransactions.length > 0)
			this.trackTransaction();
	},
	
	// Updates the label of the buy button and state based on folio.state.
	updateBuyButtonLabel: function() {
		var state = "";
		var label = "";
		switch (this.folio.state) {
			case ADOBE.FolioStates.INVALID:
				state = "Invalid";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.UNAVAILABLE:
				state = "Unavailable";
				label = "<div class='black'>Error</div>";
				break;
			case ADOBE.FolioStates.PURCHASABLE:
				label = "<div class='black'>BUY<span class='price'>&nbsp;&nbsp;" + this.folio.price + "</span></div>";
				break;
			case ADOBE.FolioStates.ENTITLED:
				label = "<div class='blue'>DOWNLOAD</div>";
				break;
			case ADOBE.FolioStates.INSTALLED:
			case ADOBE.FolioStates.DOWNLOADING:
			case ADOBE.FolioStates.PURCHASING:
				label = "<div class='grey'>VIEW</div>";
				break;
			case ADOBE.FolioStates.EXTRACTING:
			case ADOBE.FolioStates.EXTRACTABLE:
				state = "Extracting";
				label = "<div class='grey'>VIEW</div>";
				break;
		}
		
		this.$el.find("#featuredFolio .purchaseState").html(state);
		this.$el.find("#featuredFolio .buyButton").html(label);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
	
		var transaction;
		for (var i = 0; i < this.folio.currentTransactions.length; i++) {
	        transaction = this.folio.currentTransactions[i];
	        if (transaction.isFolioStateChangingTransaction()) {
	            // found one, so break and attach to this one
	            break;
	        } else {
	            // null out transaction since we didn't find a traceable one
	            transaction = null;
	        }
	    }
	
		if (!transaction)
			return;

		var transactionType = transaction.jsonClassName;
		if (transactionType != "DownloadTransaction" &&
			transactionType != "UpdateTransaction" &&
			transactionType != "PurchaseTransaction" &&
			transactionType != "ArchiveTransaction" &&
			transactionType != "ViewTransaction") {
				return;
		}
		
		// Check if the transaction is active yet
		if (transaction.state == adobeDPS.transactionManager.transactionStates.INITALIZED) {
			// This transaction is not yet started, but most likely soon will
			// so setup a callback for when the transaction starts
			transaction.stateChangedSignal.addOnce(this.trackTransaction, this);
			return;
		}
		
		this.isTrackingTransaction = true;
		
		this.currentDownloadTransaction = null;
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction") {
			this.enableBuyButton(false);
			this.showDownloadStatus(true);
			this.setDownloadPercent(0);
			
			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
		} else {
			var state;
			if (transactionType == "PurchaseTransaction")
				state = "Purchasing...";
			else if (transactionType == "ArchiveTransaction")
				state = "Archiving...";
			else if (transactionType == "ViewTransaction")
				state = "Loading...";
			
			this.$el.find("#featuredFolio .purchaseState").html(state);
			
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.$el.find("#featuredFolio .purchaseState").html("");
				this.isTrackingTransaction = false;
			}, this)
		}
	},
	
	// Handler for when a user clicks the buy button.
	buyButton_clickHandler: function() {
		var state = this.folio.state;
		if (state == ADOBE.FolioStates.PURCHASABLE) {
			this.purchase();
		} else if (state == ADOBE.FolioStates.INSTALLED || this.folio.isViewable) {
			if (this.folio.isUpdatable)
				this.displayUpdateDialog();
			else
				this.folio.view();
		} else if (state == ADOBE.FolioStates.ENTITLED) {
			if (this.isBuyButtonEnabled)
				this.download();
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$el.find("#featuredFolio .buyButton").css("opacity", value ? 1 : .6);
		
		this.isBuyButtonEnabled = value;
	},
	
	// Downloads the folio.
	download: function() {
		this.folio.download();
	},
	
	// Purchases the folio.
	purchase: function() {
		var transaction = this.folio.purchase();
		transaction.completedSignal.addOnce(function(transaction) {
			if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED) {
				this.isTrackingTransaction = false;
				this.download();
			} else if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
				alert("Sorry, unable to purchase");
			}
			
			this.updateBuyButtonLabel();
		}, this);
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var desc = "An updated version of " + this.folio.title + " is available. Do you want to download this update now?";
		var html  = "<div id='updateDialogModalBackground' class='modalBackground'>"; // Make the dialog modal.
			html +=     "<div id='updateDialog' class='dialog'>";
			html += 	    "<p id='description'>" + desc + "</p>";
			html += 	    "<button id='no'>No</button><button id='yes'>Yes</button>";
			html +=     "</div>";
			html += "</div>";

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#updateDialog").addClass("pop");
		$("#updateDialogModalBackground").css("display", "inline");
		
		var scope = this;
		$("#updateDialog").on("click", "#no", function() { scope.no_updateDialogHandler() });
		$("#updateDialog").on("click", "#yes", function() { scope.yes_updateFolio() });
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.updateDialog.remove();
		this.folio.update();
		this.showDownloadStatus(true);
		this.setDownloadPercent(0);
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		this.folio.view();
	},
	
	// Downloads are automatically paused if another one is initiated so watch for changes with this callback.
	download_stateChangedSignalHandler: function(transaction) {
		if (transaction.state == adobeDPS.transactionManager.transactionStates.FAILED) {
			alert("Unable to download folio.");
			this.download_completedSignalHandler(transaction);
		} else if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED) {
			// Downloads do not resume from the last point so set the percent back to 0.
			this.setDownloadPercent(0);
			this.$el.find("#featuredFolio #downloadToggle").addClass("downloadStatusRestart");
			this.$el.find("#featuredFolio #downloadToggle").removeClass("downloadStatusClose");
		} else {
			this.$el.find("#featuredFolio #downloadToggle").removeClass("downloadStatusRestart");
			this.$el.find("#featuredFolio #downloadToggle").addClass("downloadStatusClose");
		}
	},
	
	// Updates the progress bar for downloads and updates.
	download_progressSignalHandler: function(transaction) {
		this.setDownloadPercent(transaction.progress);
	},
	
	// Handler for when a download or update completes.
	download_completedSignalHandler: function(transaction) {
		transaction.stateChangedSignal.remove(this.download_stateChangedSignalHandler, this);
		transaction.progressSignal.remove(this.download_progressSignalHandler, this);
		transaction.completedSignal.remove(this.download_completedSignalHandler, this);
			
		this.isTrackingTransaction = false;
		this.showDownloadStatus(false);
	},
	
	// User clicked the stop/restart button for the download.
	downloadToggleButton_clickHandler: function() {
		if (!this.currentDownloadTransaction)
			return;

		if (this.currentDownloadTransaction.state == adobeDPS.transactionManager.transactionStates.PAUSED)
			this.currentDownloadTransaction.resume();
		else
			this.currentDownloadTransaction.pause();
	},
	
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.downloadStatus) {
				var html  = "<div class='downloadStatus'>";
				    html +=    "<div class='progressTrack'><div class='progressBarLeft'/><div class='progressBarMiddle'/><div class='progressBarRight'/></div>";
				    html +=    "<div id='downloadToggle' class='downloadStatusClose'></div>";
				    html += "</div>";
				    
				this.downloadStatus = $(html);
				this.downloadStatus.insertBefore(this.$el.find("#featuredFolio #tapCoversForContents"));
			}
		} else {
			if (this.downloadStatus) {
				this.downloadStatus.remove();
				this.downloadStatus = null;
			}
		}
	},
	
	setDownloadPercent: function(value) {
		value *= .01;
		var maxWidth = 225; // 225 is max width of track.
		this.$el.find("#featuredFolio .progressBarMiddle").css("width", Math.min(Math.max(maxWidth * value, 0), maxWidth) - 8); //  subtract 4 for the left and 4 for the right
	}
});
/**
 * Used on the first page of AppsView.
 * Displays each individual app thumbnail and associated text and buy button.
 */
var ADOBE = ADOBE || {};

ADOBE.AppItemPageOneView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folioPageOne",

	template: _.template("<img class='preview' index='<%= index %>' src='<%= thumbnailUrl %>' width='111' height='148' /><div id='issueNumber'><p class='appTitle'><%= title %></p></div><a href=\"<%= appStoreUrl %>\"><div class='buyButton'><div class='black'>BUY&nbsp;&nbsp;<span class='price'><%= price %></span></div></div></a>"),
	
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
});
/**
 * Used on pages after the first page in AppsView.
 * Displays each individual app thumbnail and associated text and buy button.
 */
var ADOBE = ADOBE || {};

ADOBE.AppItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folio",

	template: _.template("<img class='preview' index='<%= index %>' src='<%= thumbnailUrl %>' width='120' height='160' /><div id='issueNumber'><p class='appTitle'><%= title %></p></div><a href=\"<%= appStoreUrl %>\"><div class='buyButton'><div class='black'>BUY&nbsp;&nbsp;<span class='price'><%= price %></span></div></div></a>"),
	
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
});
/**
 * Displays the Magazines tab.
 */
var ADOBE = ADOBE || {};

ADOBE.MagazinesView = Backbone.View.extend({
	// The html string that displays the subscription buttons.
	subscriptions: "",
	
	initialize: function() {
		var scope = this;

		if (ADOBE.isAPIAvailable) {
			// Sort the folios descending.
			var list = adobeDPS.libraryService.folioMap.sort(function (a, b) {
				if (a.publicationDate < b.publicationDate)
					return 1;
				else if (a.publicationDate > b.publicationDate)
					return -1;
				else
					return 0;
			});

			// list is an associative array so put them in a regular array.
			var folios = [];
			for (var i in list) {
				folios.push(list[i]);
			}

			// Hack: For now make sure the list of folios is not zero. If it is then check
			// in one second for more folios. The code should be updated to listen for
			// adobeDPS.libraryService.folioMap.addedSignal() since folios can come in at
			// any time.
			if (folios.length == 0) {
				setTimeout(function(){ scope.initialize() }, 1000);
				return;
			}
		}
		
		// This is the first child of the HorizontalPageContainer.
		this.content = $(this.$el.children().get(0));

		this.horizontalPageContainer = new ADOBE.HorizontalPageContainer(this.$el.attr("id"));
		this.content.html("<div class='loading'>Loading...</div>");

		_.bindAll(this, "addFirstTwoPages");
		
		var eventType;
		var isShowSubscriptions = false;
		if (ADOBE.isAPIAvailable) {
			// The collection creates a clone of the folio objects so addFolios() passes a reference to the object.
			// Since the folios are not on a server we don't need to load anything so pass the folios to the constructor.
			this.collection = new ADOBE.MagazinesCollection(folios);
			this.collection.on("all", this.addFirstTwoPages);
			this.collection.trigger("add");
			
			// If the latest folio is not purchasable then the user is entitled to it.
			// If true then do not display the subscription button.
			var latestFolio = folios[0];
			var userOwnsLatestFolio = !(latestFolio.state == ADOBE.FolioStates.PURCHASABLE || latestFolio.state == ADOBE.FolioStates.UNAVAILABLE || latestFolio.state == ADOBE.FolioStates.INVALID);

			if (!userOwnsLatestFolio) {
				// Loop through the subscriptions and populate the buttons.
				var availableSubscriptions = adobeDPS.receiptService.availableSubscriptions;
				for (var s in availableSubscriptions) {
					var availableSubscription = availableSubscriptions[s];
					if (availableSubscription.isActive()) { // Users owns a subscription so do not display the subscription menu option. 
						isShowSubscriptions = false;
						break;
					} else { // Create a string for the subscription buttons.
						this.subscriptions += "<div class='subscribePurchaseButton' id='" + availableSubscription.productId + "'>" + availableSubscription.duration + " subscription for " + availableSubscription.price + "</div>";
						isShowSubscriptions = true;
					}
				}
			}
			
			eventType = "touchend";
		} else {
			this.collection = new ADOBE.MagazinesCollection();
			this.collection.url = ADOBE.FULFILLMENT_URL;
			this.collection.on("all", this.addFirstTwoPages);
			this.collection.fetch({dataType: "xml"});
			
			this.subscriptions += "<div class='subscribePurchaseButton' id='1year'>1 Year Subscription for $12.99</div>";
			this.subscriptions += "<div class='subscribePurchaseButton' id='1month'>1 Month Subscription for $1.99</div>";
			
			eventType = "mouseup";
		}
		
		this.$el.on("transitionEnd", function(){ scope.transitionEndHandler()});
		
		this.content.on(eventType, ".subscribeButton", function(){ scope.openSubscriptionDialog() });
		this.content.on(eventType, ".preview", function(e){ scope.preview_clickHandler(e) });
		this.content.on(eventType, "#printSubscribersTapHere", function(){ scope.printSubscribersTapHere_clickHander() });
		
		// If API is not available then testing on the desktop so show the subscribe buttons, otherwise only if subscriptions are available.
		if (!ADOBE.isAPIAvailable || !isShowSubscriptions || userOwnsLatestFolio) {
			$(".subscribeButton").css("display", "none");
		}

		// If there aren't any subscriptions then display the print subscribers button.
		if (this.subscriptions == "")
			$("#printSubscribersTapHere").css("display", "none");
	},
	
	// Should be called when this view is no longer used.
	clear: function() {
		this.$el.off("transitionEnd");
		this.$el.off("startdrag");
		
		var eventType = ADOBE.isAPIAvailable ? "touchend" : "mouseup";
		this.content.off(eventType, ".subscribeButton");
		this.content.off(eventType, ".preview");
		this.content.off("close", ".contentPreview");
		this.content.off(eventType, "#printSubscribersTapHere");
		this.content.off(eventType, ".buyButton");
		
		this.horizontalPageContainer.clear();
		
		this.collection.off("all");
		
		clearInterval(this.interval);
	},
			
	openSubscriptionDialog: function() {
		if (!this.horizontalPageContainer.getWasContentDragged()) {
			var scope = this;
			var subscribeDialog = new ADOBE.SubscribeDialog({model: this.subscriptions});
			$("body").append(subscribeDialog.render().el);
			subscribeDialog.open();

			// Triggered from the dialog when a purchase is successful.
			$("body").on("subscriptionPurchased", function() {
				// Remove the subscribe button.
				$(".subscribeButton").css("display", "none");
				$("#printSubscribersTapHere").css("display", "none");
				
				$("body").off("subscriptionPurchased");
			});
		}
	},
	
	preview_clickHandler: function(e) {
		if (!this.horizontalPageContainer.getWasContentDragged()) {
			var el = $(e.target);
			var productId = el.attr("productId");
			var folioNumber = ADOBE.isAPIAvailable ? adobeDPS.libraryService.folioMap.getByProductId(productId).folioNumber : this.collection.getByProductId(productId).attributes.folioNumber;
			new ADOBE.ContentPreview(el.attr("src"), this.options.previewImagePath + productId + ".jpg", folioNumber);
		}
	},
	
	printSubscribersTapHere_clickHander: function() {
		if (!this.horizontalPageContainer.getWasContentDragged()) 
			window.open("http://www.adobe.com")
	},
	
	// Adds the first two page of folios.
	// The first page includes a featured folio at the top and a row of three folios below it.
	addFirstTwoPages: function() {
		// Not sure why but on the device this is repeatedly called so need to unbind.
		this.collection.off("all");
		
		var folio, view;
		if (!ADOBE.isAPIAvailable) {
			for (var i = 0; i < this.collection.length; i++) {
				folio = this.collection.at(i);
				folio.attributes.libraryPreviewUrl +=  "/portrait";
			}
		}
		
		folio = this.collection.at(0);
		view = new ADOBE.FolioMarqueeItemView({model: folio});
		this.content.html(view.render().el);

		var len = this.collection.length;
		
		// Add the next three folios.
		for (var i = 1; i < Math.min(4, len); i++) {
			folio = this.collection.at(i);
				
			var view = new ADOBE.FolioItemPageOneView({model: folio});
			$("#thumbRow").append(view.render().el);
		}
		
		// Add the second page as a buffer.
		if (len > 4)
			this.addPage(1);
		else // There is only one page so remove the arrow.
			$("#nextArrow").css("display", "none");
		
		// First page has 4 folios and the rest have 6.
		var numPages = 1 + Math.ceil((len - 4) / 6);
		this.horizontalPageContainer.setNumPages(numPages);
	},
	
	// Adds a page of 6 folios, 2 columns x 3 rows.
	addPage: function(pageIndex) {
		if (pageIndex > this.content.children().length - 1) {
			var numFoliosOnFirstPage = 4; // The number of folios on the first page that displays the featured folio.
			var numFoliosPerPage = 6;
			
			// Make sure not to go above the number of folios.
			var len = Math.min(numFoliosOnFirstPage + numFoliosPerPage * pageIndex, this.collection.length);
			var startIndex = numFoliosOnFirstPage + numFoliosPerPage * (pageIndex - 1);
			if (startIndex < len) {
				var page = $("<div class='page'></div>").appendTo(this.content);
				for (var i = startIndex; i < len; i++) {
					folio = this.collection.at(i);
					
					var view = new ADOBE.FolioItemView({model: folio});
					page.append(view.render().el);
				}
				
				if (pageIndex == 1) // add a "tap covers for contents" icon to the second page.
					page.append("<div id='tapCoversForContents'></div>");
			}
		}
	},
	
	// Handler for when the HorizontalPageContainer stops transitioning.
	transitionEndHandler: function() {
		this.addPage(this.horizontalPageContainer.getSelectedPageIndex() + 1);
	}
});
/**
 * Displays the apps tab.
 */
var ADOBE = ADOBE || {};

ADOBE.AppsView = Backbone.View.extend({
	initialize: function() {
		var scope = this;
		
		this.collection = new ADOBE.AppsCollection();
		this.collection.url = ADOBE.APPS_URL;
		
		// This is the first child of the HorizontalPageContainer.
		this.content = $(this.$el.children().get(0));
		
		_.bindAll(this, "addFirstTwoPages");
		this.collection.bind("all", this.addFirstTwoPages);
		
		this.horizontalPageContainer = new ADOBE.HorizontalPageContainer(this.$el.attr("id"));
		this.content.html("<div class='loading'>Loading...</div>");
		
		this.collection.fetch({dataType: "xml"});
		
		this.$el.on("transitionEnd", function(){ scope.transitionEndHandler()});
		this.content.on(ADOBE.isAPIAvailable ? "touchend" : "mouseup", ".preview", function(e){ scope.preview_clickHandler(e) });
	},
	
	// Should be called when this view is no longer used.
	clear: function() {
		this.$el.off("transitionEnd");
		this.content.off(ADOBE.isAPIAvailable ? "touchend" : "mouseup", ".preview");
		
		this.horizontalPageContainer.clear();
		
		this.collection.unbind("all");
	},
	
	preview_clickHandler: function(e) {
		if (!this.horizontalPageContainer.getWasContentDragged()) {
			var el = $(e.target);
			var app = this.collection.at(Number(el.attr("index")));
			new ADOBE.ContentPreview(el.attr("src"), app.attributes.previewImageUrl, app.attributes.title);
			this.shouldPoll = false;
		}
	},
	
	// Adds the first page of apps.
	// The first page includes a featured app at the top and a row of three apps below it.
	addFirstTwoPages: function() {
		// Not sure why but on the device this is repeatedly called so need to unbind.
		this.collection.unbind("all");
		
		// Create the featured app.
		var app = this.collection.at(0);
		var html  = "<div class='page0'>";
			html += 	"<div id='featuredFolio'>";
			html +=			"<img class='preview' index='" + app.attributes.index + "' width='263' height='368' src=\"" + app.attributes.thumbnailUrl + "\">"; 
			html +=			"<div id='issueNumberApps' class='issueNumber'>" + app.attributes.title + "</div><br>";
			html +=			"<div class='row'>";
			html +=				"<a href='" + app.attributes.appStoreUrl + "'><div class='buyButton'><div class='black'><span class='label'>BUY</span> <span class='price'>" + app.attributes.price + "</span></div></div></a>";
			html +=			"</div>";
			html +=			"<div id='tapCoversForContents'></div>";
			html +=			"<div id='nextArrow'></div>";
			html += 	"</div>";
			html += 	"<div id='thumbRow' class='row'></div>";
			html += "</div>";
			
		this.content.html(html);

		var len = this.collection.length;
		// Add the next three apps.
		for (var i = 1; i < Math.min(4, len); i++) {
			folio = this.collection.at(i);
			var view = new ADOBE.AppItemPageOneView({model: folio});
			$("#thumbRow").append(view.render().el);
		}
		
		// Add the second page as a buffer.
		if (len > 4)
			this.addPage(1);
		else // There is only one page so remove the arrow.
			$("#nextArrow").css("display", "none");
			
		// First page has 4 folios and the rest have 6.
		var numPages = 1 + Math.ceil((len - 4) / 6);
		this.horizontalPageContainer.setNumPages(numPages);
	},
	
	// Adds a page of 6 apps, 2 columns x 3 rows.
	addPage: function(pageIndex) {
		if (pageIndex > this.content.children().length - 1) {
			var numAppsOnFirstPage = 4; // The number of apps on the first page that displays the featured folio.
			var numAppsPerPage = 6;
			
			// Make sure not to go above the number of apps.
			var len = Math.min(numAppsOnFirstPage + numAppsPerPage * pageIndex, this.collection.length);
			var startIndex = numAppsOnFirstPage + numAppsPerPage * (pageIndex - 1);
			if (startIndex < len) {
				var page = $("<div class='page'></div>").appendTo(this.content);
				for (var i = startIndex; i < len; i++) {
					app = this.collection.at(i);
					var view = new ADOBE.AppItemView({model: app});
					page.append(view.render().el);
				}
				
				if (pageIndex == 1) // add a "tap covers for contents" icon to the second page.
					page.append("<div id='tapCoversForContents'></div>");
			}
		}
	},
	
	// Handler for when the HorizontalPageContainer stops transitioning.
	transitionEndHandler: function() {
		this.addPage(this.horizontalPageContainer.getSelectedPageIndex() + 1);
	}
});
/**
 * Displays the Specials tab.
 */
var ADOBE = ADOBE || {};

ADOBE.SpecialsView = Backbone.View.extend({
	initialize: function() {
		var scope = this;
		
		// This is the first child of the HorizontalPageContainer.
		this.content = $(this.$el.children().get(0));
		
		this.horizontalPageContainer = new ADOBE.HorizontalPageContainer(this.$el.attr("id"));
		this.content.html("<div class='loading'>Loading...</div>");
		
		_.bindAll(this, "addFirstTwoPages");
		
		var eventType;
		if (ADOBE.isAPIAvailable) {
			// Sort the folios descending.
			var list = adobeDPS.libraryService.folioMap.sort(function (a, b) {
				if (a.publicationDate < b.publicationDate)
					return 1;
				else if (a.publicationDate > b.publicationDate)
					return -1;
				else
					return 0;
			});
 
			// list is an associative array so put them in a regular array.
			var folios = [];
			for (var i in list) {
				folios.push(list[i]);
			}

			// The collection creates a clone of the folio objects so addFolios() passes a reference to the object.
			// Since the folios are not on a server we don't need to load anything so pass the folios to the constructor.
			this.collection = new ADOBE.SpecialsCollection(folios);
			this.collection.on("all", this.addFirstTwoPages);
			this.collection.trigger("add");

			eventType = "touchend";
		} else {
			this.collection = new ADOBE.SpecialsCollection();
			this.collection.url = ADOBE.FULFILLMENT_URL;
			this.collection.on("all", this.addFirstTwoPages);
			this.collection.fetch({dataType: "xml"});
			eventType = "mouseup";
		}
		
		this.$el.on("transitionEnd", function(){ scope.transitionEndHandler()});
		
		this.content.on(eventType, ".preview", function(e){ scope.preview_clickHandler(e) });
		this.content.on(eventType, ".buyButton", function(e){ scope.buy(e)});
	},
	
	// Should be called when this view is no longer used.
	clear: function() {
		this.$el.off("transitionEnd");
		this.$el.off("startdrag");
		
		var eventType = ADOBE.isAPIAvailable ? "touchend" : "mouseup";
		this.content.off(eventType, ".preview");
		this.content.off(eventType, ".buyButton");
		this.content.off("close", ".contentPreview");
		
		this.horizontalPageContainer.clear();
		
		this.collection.off("all");
		
		clearInterval(this.interval);
	},
	
	preview_clickHandler: function(e) {
		if (!this.horizontalPageContainer.getWasContentDragged()) {
			var el = $(e.target);
			var productId = el.attr("productId");
			var folioNumber = ADOBE.isAPIAvailable ? adobeDPS.libraryService.folioMap.getByProductId(productId).folioNumber : this.collection.getByProductId(productId).attributes.folioNumber;
			new ADOBE.ContentPreview(el.attr("src"), this.options.previewImagePath + productId + ".jpg", folioNumber);
		}
	},
	
	// Adds the first two page of folios.
	// The first page includes a featured folio at the top and a row of three folios below it.
	addFirstTwoPages: function() {
		// Not sure why but on the device this is repeatedly called so need to unbind.
		this.collection.off("all");

		var folio, view;
		if (!ADOBE.isAPIAvailable) {
			for (var i = 0; i < this.collection.length; i++) {
				folio = this.collection.at(i);
				folio.attributes.libraryPreviewUrl +=  "/portrait";
			}
		}
		
		folio = this.collection.at(0);
		view = new ADOBE.SpecialsFolioMarqueeItemView({model: folio});
		this.content.html(view.render().el);
		
		var len = this.collection.length;
		
		// Add the next three folios.
		for (var i = 1; i < Math.min(4, len); i++) {
			folio = this.collection.at(i);
			
			var view = new ADOBE.FolioItemPageOneView({model: folio});
			$("#thumbRow").append(view.render().el);
		}
		
		// Add the second page as a buffer.
		if (len > 4)
			this.addPage(1);
		else // There is only one page so remove the arrow.
			$("#nextArrow").css("display", "none");
			
		// First page has 4 folios and the rest have 6.
		var numPages = 1 + Math.ceil((len - 4) / 6);
		this.horizontalPageContainer.setNumPages(numPages);
	},
	
	// Adds a page of 6 folios, 2 columns x 3 rows.
	addPage: function(pageIndex) {
		if (pageIndex > this.content.children().length - 1) {
			var numFoliosOnFirstPage = 4; // The number of folios on the first page that displays the featured folio.
			var numFoliosPerPage = 6;
			
			// Make sure not to go above the number of folios.
			var len = Math.min(numFoliosOnFirstPage + numFoliosPerPage * pageIndex, this.collection.length);
			var startIndex = numFoliosOnFirstPage + numFoliosPerPage * (pageIndex - 1);
			if (startIndex < len) {
				var page = $("<div class='page'></div>").appendTo(this.content);
				for (var i = startIndex; i < len; i++) {
					folio = this.collection.at(i);
					folio.attributes.libraryPreviewUrl +=  "/portrait";
					
					var view = new ADOBE.FolioItemView({model: folio});
					page.append(view.render().el);
				}
				
				if (pageIndex == 1) // add a "tap covers for contents" icon to the second page.
					page.append("<div id='tapCoversForContents'></div>");
			}
		}
	},
	
	// Handler for when the HorizontalPageContainer stops transitioning.
	transitionEndHandler: function() {
		this.addPage(this.horizontalPageContainer.getSelectedPageIndex() + 1);
	}
});
/**
 * Simple control for displaying tabs.
 */

var ADOBE = ADOBE || {};

ADOBE.Tabs = function(elementId,
					  imageArray, // Array of objects with file paths to each tab image {up, selected}.
					  selectedIndex) {

	// Private properties.
	var element = $("#" + elementId);
	var images = imageArray;
	var selectedIndex = selectedIndex;

	init(elementId, imageArray, selectedIndex);
	
	/**
	 * Private methods.
	 */
	function init(elementId, images, selectedIndex) {
		var html = "";
		for (var i = 0; i < images.length; i++) {
			if (i != selectedIndex) {
				html += "<img class='tabItem' src='" + images[i].up + "'>";
			} else {
				html += "<img class='tabItem' src='" + images[i].selected + "'>";
			}
		}
		
		element.html(html);
		
		var scope = this;
		$(".tabItem").click(function() {
			tabItem_clickHandler($(this).index());
		});
	}
	
	// Handler for when an image is clicked.
	function tabItem_clickHandler(index) {
		if (index != selectedIndex) {
			$(element.children().get(selectedIndex)).attr("src", images[selectedIndex].up);
			$(element.children().get(index)).attr("src", images[index].selected);
			
			selectedIndex = index;
			
			var event = document.createEvent("Event");
			event.initEvent("change", true, true);
			event.selectedIndex = index;
			element[0].dispatchEvent(event);
		}
	}
}
/**
 * Displays the content preview when a user taps an app or folio cover.
 */
var ADOBE = ADOBE || {};

ADOBE.ContentPreview = function(thumbnailUrl, previewUrl, issueNumber) {
	var el;
	
	init(thumbnailUrl, previewUrl, issueNumber);
	
	/**
	 * Private methods.
	 */
	function init(thumbnailUrl, previewUrl, issueNumber) {
		var html  = "<div class='contentPreview'>;"
			html +=		"<div id='container'>";
			html += 		"<div id='close'></div>";
			html +=			"<div id='row'>";
			html += 			"<img id='previewThumb' src=\"" + thumbnailUrl + "\" width='73' height='97'>";
			html += 			"<div id='header'></div>";
			html +=			"</div>";
			html +=			"<div id='issueNumber'><span id='label'>" + issueNumber + "</span></div>";
			html +=			"<hr>";
			html += 		"<div class='verticalScrollContainer' id='previewImage'>";
			html += 			"<div id='content'><img src=\"" + previewUrl + "\" ></div>";
			html += 			"<canvas id='scrollIndicator'></canvas>";
			html += 		"</div>";
			html +=		"</div>";
			html +=	"</div>";
			
		el = $(html).appendTo($("body"));
		
		if ($(".contentPreview #issueNumber #label").width() > 420)
			$("#previewThumb").css("visibility", "hidden");
		
		var scrollContainer = new ADOBE.VerticalScrollContainer("previewImage", -15, 10, 5);
		
		el.on("click", "#close", closeHandler);
	}
	
	function closeHandler() {
		var event = document.createEvent("MouseEvents");
		event.initEvent("close", true, true);
		el[0].dispatchEvent(event);
		
		el.remove();
	}
}
/**
 * Control for swiping between horizontal pages.
 * Does not handle the create of the actual pages. This should be done as a user
 * navigates between pages by listening to the transitionEnd event.
 */

var ADOBE = ADOBE || {};

ADOBE.HorizontalPageContainer = function(elementId) {
	var ANIMATION_DURATION = .6;		// The duration to flick the content. In seconds.
	var MOVE_THRESHOLD = 10;			// Since touch points can move slightly when initiating a click this is the
										// amount to move before allowing the element to dispatch a click event.
	
	var element;						// The container.
	var content;						// The content that will be scrolled.
	var touchStartTransformX;			// The start transformX when the user taps.
	var touchStartX;					// The start x coord when the user taps.
	var interval;						// Interval used for measuring the drag speed.
	var wasContentDragged;				// Flag for whether or not the content was dragged. Takes into account MOVE_THRESHOLD.
	var targetTransformX;				// The target transform X when a user flicks the content.
	var touchDragCoords = [];			// Used to keep track of the touch coordinates when dragging to measure speed.
	var touchstartTarget;				// The element which triggered the touchstart.
	var selectedPageIndex = 0;			// The current visible page.
	var numPages;						// The number of pages.
	var contentWidth;					// The width of the content that will be scrolled.
	var viewPortWidth;					// The width of the div that holds the horizontal content.
	var navStatus;						// The canvas that will contain the nav circles.
	var navStatusContext;				// The context of the canvas.	
	
	/**
	 * Public methods.
	 */
	ADOBE.HorizontalPageContainer.prototype.reset = function() {
		selectedPageIndex = 0;
	}
	
	ADOBE.HorizontalPageContainer.prototype.setNumPages = function(value) {
		// Need to explicitly set the width otherwise the pages will wrap.
		contentWidth = element.width() * value;
		content.css("width", contentWidth);
		numPages = value;
		
		drawNavStatus();
	}
	
	ADOBE.HorizontalPageContainer.prototype.getSelectedPageIndex = function() {
		return selectedPageIndex;
	}
	
	// Returns whether or not the user dragged the container by exceeding MOVE_THRESHOLD.
	ADOBE.HorizontalPageContainer.prototype.getWasContentDragged = function() {
		return wasContentDragged;
	}
	
	// Should be called when the element is removed.
	ADOBE.HorizontalPageContainer.prototype.clear = function() {
		element[0].removeEventListener("touchstart", touchstartHandler);
		element[0].removeEventListener("mousedown", touchstartHandler);
		clearInterval(interval);
	}
	
	
	init(elementId);
	
	/**
	 * Private methods.
	 */
	function init(elementId) {
		var scope = this;
		element = $("#" + elementId);
		element[0].addEventListener("touchstart", touchstartHandler);
		element[0].addEventListener("mousedown", touchstartHandler);
		
		viewPortWidth = element.width();
		 // For desktop testing but ok to leave in as it doesn't seem to affect performance. This is fired before the orientation is changed.
		$(window).resize(layoutNavStatus);
		
		// For device, This is fired after the orientation changes.
		$(window).bind("orientationchange", layoutNavStatus);
		
		// Get a reference to the content container.
		content = $("#" + elementId + " #content");
		content.html("");

		// Remove the duration so the new coordinate does not ease back to zero.
		content.css("-webkit-transition", "-webkit-transform 0s");
		// Set translate3d now so content doesn't flash upon first tap.
		content.css("-webkit-translate", "translate3d(0px, 0px, 0px)");
		
		setTransformX(content, 0);
		
		// Get a reference to the canvas used to draw the scroll indicator.
		navStatus = $("#" + elementId + " #navStatus");
		
		navStatusContext = navStatus[0].getContext("2d");
		layoutNavStatus();
	}
	
	// Positions the circle nav status images.
	function layoutNavStatus() {
		var offset = element.offset();
		
		// Center the circles.
		navStatus.css("left", offset.left + Math.round((element.width() - navStatus.width()) / 2));
		
		// Position the circles from the bottom.
		navStatus.css("top", offset.top + element.height() - 12);
	}
	
	// Returns the y of the transform matrix.
	function getTransformX() {
		var transformArray = content.css("-webkit-transform").split(","); // matrix(1, 0, 0, 1, 0, 0)
		var transformElement = $.trim(transformArray[4]); // remove the leading whitespace.
		return Number(transformElement);
	}
	
	// Sets the y of the transform matrix.
	function setTransformX(element, value) {
		element.css("-webkit-transform", "translate3d(" + value + "px, 0px, 0px)");
	}

	function touchstartHandler(e) {
		clearInterval(interval);
		
		// Transition in progress.
		if (targetTransformX != getTransformX())
			dispatchTransitionEndEvent();
		
		wasContentDragged = false;
		
		// Prevent the default so the window doesn't scroll and links don't open immediately.
		e.preventDefault();	
		
		// Get a reference to the element which triggered the touchstart.
		touchstartTarget = e.target;
		
		// Check for device. If not then testing on desktop.
		touchStartX = window.Touch ? e.touches[0].clientX : e.clientX;
		
		// Get the current transformX before the transition is removed.
		touchStartTransformX = getTransformX();
		
		// Set the transformX before the animation is stopped otherwise the animation will go to the end coord
		// instead of stopping at its current location which is where the drag should begin from.
		setTransformX(content, touchStartTransformX);
		
		// Remove the transition so the content doesn't tween to the spot being dragged. This also moves the animation to the end.
		content.css("-webkit-transition", "none");
		
		// Create an interval to monitor how fast the user is dragging.
		interval = setInterval(measureDragSpeed, 20);
		
		document.addEventListener("touchmove", touchablemoveHandler);
		document.addEventListener("touchend", touchableendHandler);
		document.addEventListener("mousemove", touchablemoveHandler);
		document.addEventListener("mouseup", touchableendHandler);
	}
	
	function measureDragSpeed() {
		touchDragCoords.push(getTransformX());
	}
	
	function touchablemoveHandler(e) {
		var deltaX = (window.Touch ? e.touches[0].clientX : e.clientX) - touchStartX;
		if (Math.abs(deltaX) > MOVE_THRESHOLD && !wasContentDragged) { // Keep track of whether or not the user dragged.
			wasContentDragged = true;
			
			// User dragged so dispatch a startDrag event.
			var event = document.createEvent("MouseEvents");
			event.initEvent("startdrag", true, true);
			element[0].dispatchEvent(event);
		}
			
		setTransformX(content, touchStartTransformX + deltaX);
	}
	
	function touchableendHandler(e) {
		document.removeEventListener("touchmove", touchablemoveHandler);
		document.removeEventListener("touchend", touchableendHandler);
		document.removeEventListener("mousemove", touchablemoveHandler);
		document.removeEventListener("mouseup", touchableendHandler);
		
		clearInterval(interval);
		
		e.preventDefault();
		
		if (wasContentDragged) { // User dragged more than MOVE_THRESHOLD so transition the content. 
			var previousX = getTransformX();
			var bSwitchPages;
			// Compare the last 5 coordinates
			for (var i = touchDragCoords.length - 1; i > Math.max(touchDragCoords.length - 5, 0); i--) {
				if (touchDragCoords[i] != previousX) {
					bSwitchPages = true;
					break;
				}
			}
			
			var previousSelectedPageIndex = selectedPageIndex;
			
			// User dragged more than halfway across the screen.
			if (!bSwitchPages && Math.abs(touchStartTransformX - getTransformX()) > (viewPortWidth / 2))
				bSwitchPages = true;

			if (bSwitchPages) {
				if (previousX > touchStartTransformX) { // User dragged to the right. go to previous page.
					if (selectedPageIndex > 0) // Make sure user is not on the first page otherwise stay on the same page.
						selectedPageIndex--;
				} else { // User dragged to the left. go to next page.
					if (selectedPageIndex + 1 < numPages) // Make sure user is not on the last page otherwise stay on the same page.
						selectedPageIndex++;
				}
			}
			
			if (previousSelectedPageIndex != selectedPageIndex)
				drawNavStatus();

			tweenTo(-viewPortWidth * selectedPageIndex);
		} else { // User dragged less than MOVE_THRESHOLD trigger a click event.
			var event = document.createEvent("MouseEvents");
			event.initEvent("click", true, true);
			touchstartTarget.dispatchEvent(event);
		}
	}
	
	function tweenTo(value) {
		targetTransformX = value;
		// Set the style for the transition.
		content.css("-webkit-transition", "-webkit-transform " + ANIMATION_DURATION + "s");
		
		// Need to set the timing function each time -webkit-transition is set.
		// The transition is set to ease-out.
		content.css("-webkit-transition-timing-function", "cubic-bezier(0, 0, 0, 1)");
		setTransformX(content, targetTransformX);
		
		// Set an interval to figure out when the transition ended.
		interval = setInterval(transitionHandler, 20);
	}
	
	function dispatchTransitionEndEvent() {
		var event = document.createEvent("Event");
		event.initEvent("transitionEnd", true, true);
		element[0].dispatchEvent(event);
	}
	
	function transitionHandler() {
		if (targetTransformX == getTransformX()) {
			clearInterval(interval);
			dispatchTransitionEndEvent();
		}
	}
	
	function drawNavStatus() {
		navStatusContext.clearRect(0, 0, navStatus.width(), navStatus.height())
		
		var horizontalGap = 4;
		var radius = 3;

		var totalWidth = numPages * radius * 2 + (numPages - 1) * horizontalGap;
		var centerX = Math.round((navStatus.width() - totalWidth) / 2) + 4;
		var centerY = radius * 2;
		
		// Create a background rectangle so the lines behind from the page background are covered as more circles are added.
		var buffer = 2;
		navStatusContext.fillStyle = "#ffffff";
		navStatusContext.fillRect(centerX - buffer * 6, centerY - radius - buffer * 2, totalWidth + buffer * 8, radius * 2 + buffer * 4);
		
		// Draw the circles. The selected page is black, the others are white with a black stroke.
		navStatusContext.strokeStyle = "black";
		for (var i = 0; i < numPages; i++) {
			navStatusContext.fillStyle = i == selectedPageIndex ? "#000000" : "#ffffff";
			navStatusContext.beginPath();
			navStatusContext.arc(centerX + ((radius * 2 + horizontalGap) * i), centerY, radius, 0, Math.PI * 2, true); 
			navStatusContext.closePath();
			navStatusContext.fill();
			navStatusContext.stroke();
		}
	}
}
/**
 * Displays the subscribe dialog
 */
var ADOBE = ADOBE || {};

ADOBE.SubscribeDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modalBackground",
	
	initialize: function() {
		var html  = 	"<div id='subscribeDialog' class='dialog'>";
			html += 		"<p id='title'>Subscribe to Local</p>";
			html += 		"<p id='description'>Select a digital subscription option below. Your digital subscription will start immediately from the latest issue after you complete the purchase process.</p>";
			html += 		this.model; // The model is the html of the buttons.
			html += 		"<button id='cancel'>Cancel</button>";
			html += 	"</div>";
			
		this.template = _.template(html);
	},
	
	render: function() {
		this.$el.html(this.template());
		
		var scope = this;
		this.$el.find("#cancel").on("click", function() { scope.close() });
		
		// The handler for the individual subscription buttons.
		this.$el.on("click", ".subscribePurchaseButton", function(e){ scope.subscribe_clickHandler(e) });
		
		return this;
	},
	
	open: function() {
		this.$el.find("#subscribeDialog").addClass("pop");
	},
	
	close: function() {
		this.$el.remove();
	},
	
	// Handles clicks from any of the subscription buttons.
	subscribe_clickHandler: function(e) {
		if (ADOBE.isAPIAvailable) {
			// The product id is set to the id of the element so get a reference to it.
			var productId = $(e.currentTarget).attr("id");
			
			var transaction = adobeDPS.receiptService.availableSubscriptions[productId].purchase();;
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == adobeDPS.transactionManager.transactionStates.FINISHED)
					$("body").trigger("subscriptionPurchased"); // Need to trigger from the body since this.$el is no longer in the dom.	
			});
		}
		
		this.close();
	}
});
/**
 * Control used to vertically scroll a div.
 * 
 * The element should the following HTML and css:
 * <div class='horizontalPageContainer' id='horizontalPageContainer'>
 *     <div id='content'></div>
 *     <canvas id='navStatus' width='700' height='10'></canvas>
 * </div>
 * 
 * .verticalScrollContainer {
 *     overflow: hidden;
 * }
 * .verticalScrollContainer #scrollIndicator {
 *     position: absolute;
 *     left: 0px;
 *     top: 0px;
 * }
 */

var ADOBE = ADOBE || {};

ADOBE.VerticalScrollContainer = function(elementId, pScrollIndicatorRightPadding, pScrollIndicatorTopPadding, pScrollIndicatorBottomPadding) {
	var ANIMATION_DURATION = .5;				// The duration to flick the content. In seconds
	var MULTIPLIER_PIXEL_MOVE = 300;			// The multiplier number of pixels to move the list after a mouseUp event.
	var MOVE_THRESHOLD = 10;					// Since touch points can move slightly when initiating a click this is the
												// amount to move before allowing the element to dispatch a click event.
	
	var SCROLL_INDICATOR_FADE_OUT_DURATION = .3;// The duration to fadeout scrollIndicator after the transition completes.
	var SCROLL_INDICATOR_WIDTH = 6;				// The width of scrollIndicator.
	var SCROLL_INDICATOR_RADIUS = 3;			// The radius of the top and bottom semicircles of scrollIndicator.
	var SCROLL_INDICATOR_MIN_HEIGHT = 8;		// The minimum height of scrollIndicator.
	
	var scrollIndicatorRightPadding = pScrollIndicatorRightPadding;		// The amount of right padding between scrollIndicator and the right edge.
	var scrollIndicatorTopPadding = pScrollIndicatorTopPadding;			// The amount of top padding between scrollIndicator and the top edge.
	var scrollIndicatorBottomPadding = pScrollIndicatorBottomPadding;	// The amount of bottom padding between scrollIndicator and the bottom edge.
	
	var element;								// The container.
	var content;								// The content that will be scrolled.
	var touchStartTransformY;					// The start transformY when the user taps.
	var touchStartY;							// The start y coord when the user taps.
	var interval;								// Interval used for measuring the drag speed.
	var wasContentDragged;						// Flag for whether or not the content was dragged. Takes into account MOVE_THRESHOLD.
	var targetTransformY;						// The target transform Y when a user flicks the content.
	var touchDragCoords = [];					// Used to keep track of the touch coordinates when dragging to measure speed.
	var touchstartTarget;						// The element which triggered the touchstart.
	var totalScrollAmount;						// The total allowable amount in px to move scrollIndicator.
	var scrollIndicator;						// A reference to the selection for the canvas which will draw the scrollbar.
	var scrollIndicatorHeight;  				// The height of the scrollIndicator when a user has not dragged
												// the content below the top edge or above the bottom edge,
												// ie: scrollDelta > 0 && scrollDelta < 1
	var maxScroll;								// The maximum amount to scroll the content.
	var scrollIndicatorContext;					// The context of the scrollIndicator canvas.
	var previousScrollIndicatorHeight;			// The last height of scrollIndicator. Used to determine whether or not it should be redrawn.
	var DOMSubtreeModifiedTimeout;				// Used to cancel the previous timeout when the DOM tree has been modified. This is to prevent repetitive updates.
	
	/**
	 * Public methods.
	 */
	ADOBE.VerticalScrollContainer.prototype.reset = function() {
		setTransformY(content, 0);
		setTransformY(scrollIndicator, 0);
	}
	
	
	init(elementId);
	
	/**
	 * Private methods.
	 */
	function init(elementId) {
		var scope = this;
		element = $("#" + elementId);
		element[0].addEventListener("touchstart", touchstartHandler);
		element[0].addEventListener("mousedown", touchstartHandler);
		
		 // For desktop testing but ok to leave in as it doesn't seem to affect performance. This is fired before the orientation is changed.
		$(window).resize(updateMaxScroll);
		
		// For device, This is fired after the orientation changes.
		$(window).bind("orientationchange", updateMaxScroll);
		
		// Get a reference to the content container.
		content = $("#" + elementId + " #content");
		// Set translate3d now so content doesn't flash upon first tap.
		content.css("-webkit-transform", "translate3d(0px, 0px, 0px)");
		
		// Get a reference to the canvas used to draw the scroll indicator.
		scrollIndicator = $("#" + elementId + " #scrollIndicator");
		
		scrollIndicatorContext = scrollIndicator[0].getContext("2d");
		
		content[0].addEventListener("DOMSubtreeModified", DOMSubtreeModifiedHandler);
		
		scrollIndicator.css("opacity", 0);
	}
	
	function DOMSubtreeModifiedHandler() {
		clearTimeout(DOMSubtreeModifiedTimeout);
		DOMSubtreeModifiedTimeout = setTimeout(updateMaxScroll, 10);
	}
	
	function updateMaxScroll() {
		maxScroll = element.height() - getContentHeight();
		// Remove the transition in case one is in progress.
		content.css("-webkit-transition", "none");
		
		if (maxScroll < 0)
		{
			// Update the coordinates of scrollIndicator so it is always aligned with the right and top edge of the scrollable area.
			var offset = element.offset();
			
			// Calculate the values used for sizing scrollIndicator.
			var availableHeight = element.height() - scrollIndicatorTopPadding - scrollIndicatorBottomPadding;
			scrollIndicatorHeight = Math.max(Math.round((availableHeight / getContentHeight()) * availableHeight), SCROLL_INDICATOR_MIN_HEIGHT);
			previousScrollIndicatorHeight = scrollIndicatorHeight;
			
			// Set the width/height directly on the canvas otherwise it will not size correctly.
			scrollIndicator[0].height = scrollIndicatorHeight;
			scrollIndicator[0].width = SCROLL_INDICATOR_WIDTH;
			scrollIndicator.css("left", offset.left + element.width() - scrollIndicatorRightPadding - SCROLL_INDICATOR_WIDTH);
			scrollIndicator.css("top", offset.top + scrollIndicatorTopPadding);
			
			totalScrollAmount = availableHeight - scrollIndicatorHeight;
			
			setScrollIndicatorHeight(scrollIndicatorHeight);
			
			if (getTransformY() < maxScroll) // Make sure content isn't above the bottom edge.
				setTransformY(content, maxScroll);
			
			updateScrollIndicator();
		}
		else
		{
			maxScroll = 0;
			setTransformY(content, 0);
			setTransformY(scrollIndicator, 0);
			scrollIndicatorContext.clearRect(0, 0, SCROLL_INDICATOR_WIDTH, scrollIndicator.height());
		}
	}
	
	function setScrollIndicatorHeight(value) {
		if (maxScroll < 0) {
			value = Math.round(value);
			scrollIndicatorContext.clearRect(0, 0, SCROLL_INDICATOR_WIDTH, scrollIndicator.height());
			scrollIndicatorContext.fillStyle = "rgba(0, 0, 0, 0.4)"; 
			scrollIndicatorContext.fillRect(0, SCROLL_INDICATOR_RADIUS, SCROLL_INDICATOR_WIDTH, value - SCROLL_INDICATOR_RADIUS * 2);
			
			scrollIndicatorContext.strokeStyle = "rgba(0, 0, 0, 1)"; 
			scrollIndicatorContext.beginPath();
			scrollIndicatorContext.arc(SCROLL_INDICATOR_RADIUS, SCROLL_INDICATOR_RADIUS, SCROLL_INDICATOR_RADIUS, Math.PI, 0, false);
			scrollIndicatorContext.fill();
			
			scrollIndicatorContext.beginPath();
			scrollIndicatorContext.arc(SCROLL_INDICATOR_RADIUS, value - SCROLL_INDICATOR_RADIUS, SCROLL_INDICATOR_RADIUS, 0, Math.PI, false);
			scrollIndicatorContext.fill();
		}
	}
	
	function updateScrollIndicator() {
		var delta = getTransformY() / maxScroll;
		var newHeight;
		if (delta < 0) { // user dragged below the top edge.
			setTransformY(scrollIndicator, 0);
			// Shrink scrollIndicator.height by the amount a user has scrolled below the top edge.
			newHeight = -getTransformY() + scrollIndicatorHeight;
			newHeight = Math.max(SCROLL_INDICATOR_MIN_HEIGHT, newHeight);
		
			setScrollIndicatorHeight(newHeight);
		} else if (delta < 1) {
			if (previousScrollIndicatorHeight != scrollIndicatorHeight)
				setScrollIndicatorHeight(Math.round(scrollIndicatorHeight));
			
			var newY = Math.round(delta * totalScrollAmount);
			newY = Math.min(element.height() - scrollIndicatorHeight - scrollIndicatorBottomPadding, newY);
			setTransformY(scrollIndicator, Math.round(newY));
			
			newHeight = scrollIndicatorHeight;
		} else {	// User dragged above the bottom edge.
			// Shrink scrollIndicator.height by the amount a user has scrolled above the bottom edge.
			newHeight = scrollIndicatorHeight - (-getTransformY() + maxScroll);
			newHeight = Math.max(SCROLL_INDICATOR_MIN_HEIGHT, newHeight);
			setScrollIndicatorHeight(newHeight);
			
			setTransformY(scrollIndicator, element.height() - newHeight - scrollIndicatorBottomPadding * 2);
		}
		
		previousScrollIndicatorHeight = newHeight;
	}
	
	// Returns the y of the transform matrix.
	function getTransformY() {
		var transformArray = content.css("-webkit-transform").split(","); // matrix(1, 0, 0, 1, 0, 0)
		var transformElement = $.trim(transformArray[5]); // remove the leading whitespace.
		return transformX = Number(transformElement.slice(0, transformElement.length - 1)); // Remove the ). 
	}
	
	// Sets the y of the transform matrix.
	function setTransformY(element, value) {
		element.css("-webkit-transform", "translate3d(0px," + value + "px, 0px)");
	}
	
	function getContentHeight() {
		var paddingTop = content.css("padding-top");
		paddingTop = paddingTop.slice(0, paddingTop.length - 2);

		var paddingBottom = content.css("padding-bottom");
		paddingBottom = paddingBottom.slice(0, paddingBottom.length - 2);
		
		return content.height() + Number(paddingTop) + Number(paddingBottom);
	}
	
	function touchstartHandler(e) {
		clearInterval(interval);
		
		updateMaxScroll();
		
		wasContentDragged = false;
		
		// Prevent the default so the window doesn't scroll and links don't open immediately.
		e.preventDefault();	
		
		// Get a reference to the element which triggered the touchstart.
		touchstartTarget = e.target;
		
		// Check for device. If not then testing on desktop.
		touchStartY = window.Touch ? e.touches[0].clientY : e.clientY;
		
		// Get the current transformY before the transition is removed.
		touchStartTransformY = getTransformY();
		
		// Set the transformY before the animation is stopped otherwise the animation will go to the end coord
		// instead of stopping at its current location which is where the drag should begin from.
		setTransformY(content, touchStartTransformY);
		
		// Remove the transition so the content doesn't tween to the spot being dragged. This also moves the animation to the end.
		content.css("-webkit-transition", "none");
		
		// Remove the transition in case it is still fading out.
		scrollIndicator.css("-webkit-transition", "none");
		scrollIndicator.css("opacity", 1);
		
		// Create an interval to monitor how fast the user is dragging.
		interval = setInterval(measureDragSpeed, 10);
		
		document.addEventListener("touchmove", touchablemoveHandler);
		document.addEventListener("touchend", touchableendHandler);
		document.addEventListener("mousemove", touchablemoveHandler);
		document.addEventListener("mouseup", touchableendHandler);
	}
	
	function measureDragSpeed() {
		touchDragCoords.push({transformY: getTransformY(), dragTime: new Date().getTime()});
	}
	
	function touchablemoveHandler(e) {
		var deltaY = (window.Touch ? e.touches[0].clientY : e.clientY) - touchStartY;
		if (Math.abs(deltaY) > MOVE_THRESHOLD) // Keep track of whether or not the user scrolled.
			wasContentDragged = true;
			
		setTransformY(content, touchStartTransformY + deltaY);
		
		updateScrollIndicator();
	}
	
	function touchableendHandler(e) {
		document.removeEventListener("touchmove", touchablemoveHandler);
		document.removeEventListener("touchend", touchableendHandler);
		document.removeEventListener("mousemove", touchablemoveHandler);
		document.removeEventListener("mouseup", touchableendHandler);
		
		clearInterval(interval);
		
		if (wasContentDragged) { // User dragged more than MOVE_THRESHOLD so transition the content. 
			var height = element.height();
			var contentHeight = getContentHeight();
			var transformY = getTransformY();
			
			if (transformY > 0 || // Below the top edge.
				contentHeight < height) { // The view does not scroll.
				targetTransformY  = 0;
			} else if (-transformY + height > contentHeight) { // Above the bottom edge. transformY will be negative
				targetTransformY = -contentHeight + height;
			} else {
				if (touchDragCoords.length > 3) { // Calculate the speed based on the last three touch coordinates
					var elapsedMiliseconds = touchDragCoords[touchDragCoords.length - 1].dragTime - touchDragCoords[touchDragCoords.length - 3].dragTime;
					var pixelsPerMillisecond = (touchDragCoords[touchDragCoords.length - 1].transformY - touchDragCoords[touchDragCoords.length - 3].transformY) / elapsedMiliseconds;
					targetTransformY = Math.round(pixelsPerMillisecond * MULTIPLIER_PIXEL_MOVE + transformY);
				} else {
					targetTransformY = Number.NaN;
				}
			}
			
			if (!isNaN(targetTransformY) && targetTransformY != transformY) {
				if (targetTransformY > 0) // Make sure targetTransformY isn't below the top edge.
					targetTransformY = 0;
				else if (targetTransformY < height - contentHeight && // Make sure targetTransformY isn't above the bottom edge.
						contentHeight > height) // If above bottom edge make sure the view scrolls.
					targetTransformY = height - contentHeight;
				
				targetTransformY = Math.round(targetTransformY);
				
				// Set the style for the transition.
				content.css("-webkit-transition", "-webkit-transform " + ANIMATION_DURATION + "s");
				
				// Need to set the timing function each time -webkit-transition is set.
				// The transition is set to ease-out.
				content.css("-webkit-transition-timing-function", "cubic-bezier(0, 0, 0, 1)");
				setTransformY(content, targetTransformY);
				
				interval = setInterval(transitionHandler, 20);
			} else {
				fadeOutScrollIndicator();
				dispatchTransitionEndEvent();
			}
			
			// Remove all of the elements from the array.
			touchDragCoords.splice(0, touchDragCoords.length);
		} else { // User dragged less than MOVE_THRESHOLD trigger a click event.
			var event = document.createEvent("MouseEvents");
			event.initEvent("click", true, true);
			touchstartTarget.dispatchEvent(event);
			
			fadeOutScrollIndicator();
			dispatchTransitionEndEvent();
		}
	}
	
	function dispatchTransitionEndEvent() {
		var event = document.createEvent("Event");
		event.initEvent("transitionEnd", true, true);
		element[0].dispatchEvent(event);
	}
	
	function transitionHandler() {
		updateScrollIndicator();
		if (targetTransformY == getTransformY()) {
			clearInterval(interval);
			dispatchTransitionEndEvent();
			
			fadeOutScrollIndicator();
		}
	}
	
	function fadeOutScrollIndicator() {
		// Set the style for the transition.
		scrollIndicator.css("-webkit-transition", "opacity " + SCROLL_INDICATOR_FADE_OUT_DURATION + "s");
		scrollIndicator.css("opacity", 0);
	}
}
/**
 * Displays the main application view.
 */
var ADOBE = ADOBE || {};

ADOBE.AppView = Backbone.View.extend({
	// Used by MagazinesCollection and SpecialsCollection. Returns the available folios from the fulfillment server.
	FULFILLMENT_URL: "http://lighthouse.adobe.com/dps/v2_library_store_templates/fulfillment_proxy.php?accountId=ed04c68418b74672a98fdcbbb2d90878",
	
	// Used by AppsView. Returns a list of apps that can be downloaded from the app store.
	APPS_URL: "http://lighthouse.adobe.com/dps/horizontal_swipe_store/apps.xml",
	
	// The path to where the images are hosted.
	IMAGE_PATH_URL: "http://lighthouse.adobe.com/dps/horizontal_swipe_store/images/",
	
	// The directory which hosts the previews.
	PREVIEW_DIR: "previews/",
	
	selectedView: null,
	
	initialize: function(isAPIAvailable) {
		ADOBE.isAPIAvailable = isAPIAvailable;
		ADOBE.FULFILLMENT_URL = this.FULFILLMENT_URL;
		ADOBE.APPS_URL = this.APPS_URL;
		
		if (isAPIAvailable) {
			// Put the FolioStates in the ADOBE namespace for easier lookup later.
			ADOBE.FolioStates = adobeDPS.libraryService.folioStates;
		}
		
		var html  = "<div id='header'>";
		    html += 	"<div id='content'>";
		    html += 		"<div id='banner'></div>";
		    html += 		"<div id='tabs'></div>";
		    html += 	"</div>";
		    html += "</div>";
		    
		    // The main content area.
		    html +=	"<div class='horizontalPageContainer' id='horizontalPageContainer'>";
		    html += 	"<div id='content'></div>"; // All content goes in this div.
			html += 	"<canvas id='navStatus' width='700' height='10'></canvas>"; // The nav status circle icons.
		    html += "</div>";
		    
		//html += "<textarea class='debug'></textarea>";
		
		// Uncomment the textarea above to enable debug output via debug().
		window.debug = function(value) {
			$(".debug").val($(".debug").val() + ($(".debug").val() == "" ? "" : "\n") + value);
		}
		

		$("body").append(html);
		
		var preloadImages = [this.IMAGE_PATH_URL + "banner_apps.jpg",	// Preload the tab banners.
							 this.IMAGE_PATH_URL + "banner_specials.jpg"];
		for (var i = 0; i < preloadImages.length; i++) {
			(new Image()).src = preloadImages[i];
		}
		
		this.selectedView = new ADOBE.MagazinesView({el: $(".horizontalPageContainer"),
													 previewImagePath: this.IMAGE_PATH_URL + this.PREVIEW_DIR});
				
		// Create the tabs in the upper right.
		var tabs = new ADOBE.Tabs("tabs",
								 [{up: this.IMAGE_PATH_URL + "tab_magazines_up.png",
								   selected: this.IMAGE_PATH_URL + "tab_magazines_selected.png"},
								  {up: this.IMAGE_PATH_URL + "tab_apps_up.png",
								   selected: this.IMAGE_PATH_URL + "tab_apps_selected.png"},
								  {up: this.IMAGE_PATH_URL + "tab_specials_up.png",
								   selected: this.IMAGE_PATH_URL + "tab_specials_selected.png"}],
								  0);
								  
		$("#banner").attr("class", "magazineBanner");
		var scope = this;
		document.getElementById("tabs").addEventListener("change", function(e){ scope.tabs_changeHandler(e) });
	},
	
	tabs_changeHandler: function(e) {
		this.selectedView.clear();
		
		if (e.selectedIndex == 0) {
			this.selectedView = new ADOBE.MagazinesView({el: $(".horizontalPageContainer"),
														 previewImagePath: this.IMAGE_PATH_URL + this.PREVIEW_DIR});
			
			$("#banner").attr("class", "magazineBanner");
		} else if (e.selectedIndex == 1) {
			this.selectedView = new ADOBE.AppsView({el: $(".horizontalPageContainer")});
			
			$("#banner").attr("class", "appsBanner");
		} else if (e.selectedIndex == 2) {
			this.selectedView = new ADOBE.SpecialsView({el: $(".horizontalPageContainer"),
												  		previewImagePath: this.IMAGE_PATH_URL + this.PREVIEW_DIR});
			
			$("#banner").attr("class", "specialsBanner");
		}
	}
});