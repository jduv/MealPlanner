var mealPlannerApp = (function() {
	return {
		// Write me.
	}
}());

// Main application execution.
(function() {
	// Hooks for doc.ready
	$(document).ready(function () {
		// Load all templates.
		loadTemplates(runApp);

		// set up navbar class toggling
		$('.nav li a').click(function()
		{
			$('.nav li').removeClass('active');
			$(this).parent().addClass('active');
		});
	});

	// Loads templates.
	function loadTemplates(success)
	{
		$.get("./tpl/templates.html")
		.done(function(data) {
				// Append templates to the end of the body tag
				$("head").append(data);

				// Reboot ICH, removes loaded templates from DOM once built.
				ich.grabTemplates();
				success();
			})
		.fail(function() {
			$("#app").append("<h1>Error loading templates! Unable to continue!</h1>");
		});
	}

	// Runs the app. Call after templates are loaded.
	function runApp()
	{
		// Add main sammy route
		var app = $.sammy("#app", function() {

			// Make transitions purdy.
			this.swap = function(content, callback) {
				var context = this;
				context.$element().hide();
	       		context.$element().html(content);
	       		context.$element().fadeIn('fast', function() {
		       		if (callback) {
		       			callback.apply();
		       		}
	       		});
			};

			this.get("#boot", function(context) {
				$("#app").html(ich.recipes());
				$("#nav-recipes").addClass("active");
				$("#back-cancel-btn").hide();
			});

		     // set up routes.
		     this.get("#recipes", function(context) {
		     	context.app.swap(ich.recipes());
		     	$("#nav-recipes").addClass("active");
		     	$("#nav-planner").removeClass("active");
		     	$("#add-recipe-btn").fadeIn("fast");
		     	$("#back-cancel-btn").fadeOut("fast");	
		     });

		     this.get("#planner", function(context) {
		     	context.app.swap(ich.planner());
		     	$("#nav-planner").addClass("active");
		     	$("#nav-recipes").removeClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#back-cancel-btn").fadeOut("fast");		     	
		     })

		     this.get("#newRecipe", function(context) {
		     	context.app.swap(ich.newRecipe());
		     	$(".nav li").removeClass("active");

		     	// check to see if the button is shown first.
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#back-cancel-btn").fadeIn("fast");
		     })
		 });

		// Run the application
		app.run("#boot");
	}
})();