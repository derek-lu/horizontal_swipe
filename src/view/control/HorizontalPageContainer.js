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
