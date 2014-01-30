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
