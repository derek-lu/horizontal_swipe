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
