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
