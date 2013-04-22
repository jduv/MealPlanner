// This module contains the business logic for the app.
var mealPlannerApp = (function() {
	return {
		// Write me.
	}
}());

// Main application execution. Sets up routes and handles page swapping.
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
				$("#app").html(ich.recipeView());
				$("#nav-recipes").addClass("active");
				$("#add-recipe-btn").prop("href", "#newRecipe").fadeIn("fast");
			});

		     this.get("#recipes", function(context) {
		     	context.app.swap(ich.recipeView());
		     	$("#add-recipe-btn").prop("href", "#newRecipe").fadeIn("fast");
		     	$("#btn-back").fadeOut("fast");	
		     });

		     this.get("#ingredients", function(context) {
		     	context.app.swap(ich.ingredientsView());
		     	$("#add-recipe-btn").prop("href", "#newIngredient").fadeIn("fast");
		     	$("#btn-back").fadeOut("fast");	
		     });

		     this.get("#planner", function(context) {
		     	context.app.swap(ich.plannerView());
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").fadeOut("fast");		     	
		     })

		     this.get("#newRecipe", function(context) {
		     	var newRecipe = ich.newRecipeView();
		     	var ingredient = ich.ingredient({ id : 0 });
		     	newRecipe.find(".ingredients-list").append(ingredient);
		     	context.app.swap(newRecipe);

		     	// handle navigation stuff
		     	$(".nav li").removeClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").prop("href", "#recipes").fadeIn("fast");
		     });

			this.get("#newIngredient", function(context) {
		     	context.app.swap(ich.newIngredientView());

		     	// handle navigation stuff
		     	$(".nav li").removeClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").prop("href", "#ingredients").fadeIn("fast");
		     });

		     this.post("#addRecipe", function(context) {
	     		console.log("Posted to recipes");
		     });
		 });

		// Run the application
		app.run("#boot");
	}
})();