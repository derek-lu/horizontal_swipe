/**
 * Displays the main application view.
 */
var ADOBE = ADOBE || {};

ADOBE.AppView = Backbone.View.extend({
	// Used by MagazinesCollection and SpecialsCollection. Returns the available folios from the fulfillment server.
	FULFILLMENT_URL: "http://www.dpsapps.com/dps/v2_library_store_templates/fulfillment_proxy.php?accountId=ed04c68418b74672a98fdcbbb2d90878",
	
	// Used by AppsView. Returns a list of apps that can be downloaded from the app store.
	APPS_URL: "http://www.dpsapps.com/dps/horizontal_swipe_store/apps.xml",
	
	// The path to where the images are hosted.
	IMAGE_PATH_URL: "http://www.dpsapps.com/dps/horizontal_swipe_store/images/",
	
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