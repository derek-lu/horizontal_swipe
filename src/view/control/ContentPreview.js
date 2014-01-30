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
