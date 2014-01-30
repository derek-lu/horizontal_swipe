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
