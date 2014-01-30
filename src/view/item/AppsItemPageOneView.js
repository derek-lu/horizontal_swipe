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
