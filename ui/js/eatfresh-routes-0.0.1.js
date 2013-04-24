// Main application execution. Sets up routes and handles page swapping.
(function() {

	// Hooks for doc.ready
	$(document).ready(function () {

		// set up navbar class toggling
		$('.nav li a').click(function()
		{
			$('.nav li').removeClass('active');
			$(this).parent().addClass('active');
		});

		// Initialize parse before running any routes. Should be done by the time
		// the templates have loaded.
		Parse.$ = jQuery;
		Parse.initialize('KFtPLb9t9N2N652Idpg9YAMJTlEDoe89DnUHqInJ', 
						 'RINplytisIJGgxFTgPlBqeXZ6jfMRLPZncmk9243');

		// Run the application only if tempaltes are loaded. This method calls
		// the loadTemplates only once instead of befor each route.
		loadTemplates(function () { app.run('#boot') });
	});

	// Loads templates; only once.
	function loadTemplates(callback)
	{
			$.get('./tpl/templates.html')
			.done(function(data, status, request) {
					// Append templates to the end of the body tag
					$('head').append(data);
					// Reboot ICH, removes loaded templates from DOM once built.
					ich.grabTemplates();
					// tempaltes are good, execute route.
					templatesLoaded = true;
					callback();
				})
			.fail(function(request, status, error) {
				ui.showModalError('We encountered a problem when loading site templates! Error: <br><br>' + error);
			});
	}

	var app = $.sammy('#app', function() {

		// Make transitions purdy.
		this.swap = function(content, callback) {
			var context = this;
			context.$element().hide();
       		context.$element().html(content);
       		context.$element().trigger('create');

       		context.$element().fadeIn('fast', function() {
	       		if (callback) {
	       			callback.apply();
	       		}
       		});
		};

		// Home screen. Default to recipe view with some tweaks
		this.get('#boot', function(context) {
			$('#app').html(ich.recipeView());
			$('#nav-recipes').addClass('active');
			$('#add-recipe-btn').prop('href', '#newRecipeView').fadeIn('fast');
		});

		// Recipe view.
	     this.get('#recipeView', function(context) {
	     	context.app.swap(ich.recipeView());
	     	$('#nav-recipes').addClass('active');
	     	$('#add-recipe-btn').prop('href', '#newRecipeView').fadeIn('fast');
	     	$('#btn-back').fadeOut('fast');	
	     });

	     // Ingredients view.
	     this.get('#ingredientsView', function(context) {
	     	context.app.swap(ich.ingredientsView());
	     	$('#nav-ingredients').addClass('active');
	     	$('#add-recipe-btn').prop('href', '#newIngredientView').fadeIn('fast');
	     	$('#btn-back').fadeOut('fast');	
	     });

	     // Planner view
	     this.get('#plannerView', function(context) {
	     	context.app.swap(ich.plannerView());
	     	$('#nav-planner').addClass('active');
	     	$('#add-recipe-btn').fadeOut('fast');
	     	$('#btn-back').fadeOut('fast');		     	
	     })

	     // New recipe view
	     this.get('#newRecipeView', function(context) {
	     	
	     	var controller = eatfresh.newRecipeViewController();
	     	controller.loadView(function(view) {
	     		context.app.swap(view);
	     	});

	     	$('.nav li').removeClass('active');
	     	$('#add-recipe-btn').fadeOut('fast');
	     	$('#btn-back').prop('href', '#recipeView').fadeIn('fast');
	     });

	     // New ingredient view
		 this.get('#newIngredientView', function(context) {

			var controller = eatfresh.newIngredientViewController()
			controller.loadView(function (view) {
				context.app.swap(view);
			});

	     	$('.nav li').removeClass('active');
	     	$('#add-recipe-btn').fadeOut('fast');
	     	$('#btn-back').prop('href', '#ingredientsView').fadeIn('fast');
	     });

	     this.post('#addRecipe', function(context) {
	     	var formData = $(context.target).toObject();
     		console.log(JSON.stringify(formData));
	     });

	     this.post('#addIngredient', function(context) {
	     	var formData = $(context.target).toObject();
     		console.log(JSON.stringify(formData));
	     });
	 });
})();