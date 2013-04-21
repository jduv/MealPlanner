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
			$("#app").append("Error loading templates!");
		});
	}

	// Runs the app. Call after templates are loaded.
	function runApp()
	{
		// Add main sammy route
		var app = $.sammy("#app", function() {
			var currentHash;
			var transitioning = false;

			// Make transitions purdy.
			this.swap = function(content, callback) {
				var context = this;
		     	context.$element().fadeOut('fast', function() {
		       		context.$element().html(content);
		       		context.$element().fadeIn('fast', function() {
			       		if (callback) {
			       			callback.apply();
			       		}
	       			});
		       });
			};

			this.get("#boot", function(context) {
				$(".front").html(ich.recipes());
			});

		     // set up routes.
		     this.get("#recipes", function(context) {
	     		console.log("transitioning not false");
		     	context.app.swap(ich.recipes());
		     	$("#nav-recipes").addClass("active");
		     	$("#nav-planner").removeClass("active");
		     });

		     this.get("#planner", function(context) {
	     		console.log("transitioning not false");
		     	context.app.swap(ich.planner());
		     	$("#nav-planner").addClass("active");
		     	$("#nav-recipes").removeClass("active");		     	
		     })

		     this.get("#newRecipe", function(context) {
		     	context.app.swap(ich.newRecipe());
		     })
		 });

		// Run the application
		app.run("#boot");
	}
})();