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
