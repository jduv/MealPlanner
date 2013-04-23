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

			var currentController;

			// Make transitions purdy.
			this.swap = function(content, callback) {
				var context = this;
				context.$element().hide();
	       		context.$element().html(content);
	       		context.$element().trigger("create");

	       		context.$element().fadeIn('fast', function() {
		       		if (callback) {
		       			callback.apply();
		       		}
	       		});
			};

			this.get("#boot", function(context) {
				$("#app").html(ich.recipeView());
				$("#nav-recipes").addClass("active");
				$("#add-recipe-btn").prop("href", "#newRecipeView").fadeIn("fast");
			});

		     this.get("#recipeView", function(context) {
		     	context.app.swap(ich.recipeView());
		     	$("#nav-recipes").addClass("active");
		     	$("#add-recipe-btn").prop("href", "#newRecipeView").fadeIn("fast");
		     	$("#btn-back").fadeOut("fast");	
		     });

		     this.get("#ingredientsView", function(context) {
		     	context.app.swap(ich.ingredientsView());
		     	$("#nav-ingredients").addClass("active");
		     	$("#add-recipe-btn").prop("href", "#newIngredientView").fadeIn("fast");
		     	$("#btn-back").fadeOut("fast");	
		     });

		     this.get("#plannerView", function(context) {
		     	context.app.swap(ich.plannerView());
		     	$("#nav-planner").addClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").fadeOut("fast");		     	
		     })

		     this.get("#newRecipeView", function(context) {
		     	// Let the controller handle the nasty stuff.
		     	currentController = controllerFactory.newRecipeViewController();
		     	context.app.swap(currentController.getNewRecipeView());

		     	// We should handle navigation stuff
		     	$(".nav li").removeClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").prop("href", "#recipeView").fadeIn("fast");
		     });

			this.get("#newIngredientView", function(context) {
				currentController = controllerFactory.newIngredientViewController()
		     	context.app.swap(currentController.getNewIngredientView());

		     	// We should handle navigation stuff
		     	$(".nav li").removeClass("active");
		     	$("#add-recipe-btn").fadeOut("fast");
		     	$("#btn-back").prop("href", "#ingredientsView").fadeIn("fast");
		     });

		     this.post("#addRecipe", function(context) {
		     	var formData = $(context.target).toObject();
	     		console.log(JSON.stringify(formData));

	     		// Silently submit.
	     		return false;
		     });

		     this.post("#addIngredient", function(context) {
		     	console.log("Posted to ingredients");
		     });
		 });

		// Run the application
		app.run("#boot");
	}
})();