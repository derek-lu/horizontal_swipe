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
