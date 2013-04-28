// Main application execution. Sets up routes and handles page swapping.
(function () {
	var fadeTime = 500;
	var ingredientController;
	var recipeController;
	var ingredientListController;

	// Hooks for doc.ready
	$(document).ready(function () {

		// set up navbar class toggling
		$('.nav li a').click(function ()
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
		loadTemplates(function () { app.run('#signin') });
	});

	// Loads templates; only once.
	function loadTemplates(callback)
	{
			$.get('./tpl/templates.html')
			.done(function (data, status, request) {
					// Append templates to the end of the body tag
					$('head').append(data);
					// Reboot ICH, removes loaded templates from DOM once built.
					ich.grabTemplates();
					// tempaltes are good, execute route.
					templatesLoaded = true;
					callback();
				})
			.fail(function (request, status, error) {
				ui.showModalError('We encountered a problem when loading site templates! Error: <br><br>' + error);
			});
	}

	var app = $.sammy('#app', function () {

		// Make transitions purdy.
		this.swap = function (content, callback) {
			var context = this;
			context.$element().hide();
       		context.$element().html(content);
       		context.$element().trigger('create');

       		context.$element().fadeIn(fadeTime, function () {
	       		if (callback) {
	       			callback.apply();
	       		}
       		});
		};

		var loadRecipesView = function (context) {
			recipeListController = eatfresh.newRecipeListController();
	     	recipeListController.loadView(function(view) {
	     		context.app.swap(view);
	     	})
		}

		// Login screen.
		this.get('#signin', function (context) {
			$('#navbar').hide();
			context.app.swap(ich.signinView());
		});

		this.get('#signup', function(context) {
			$('#navbar').hide();
			context.app.swap(ich.signupView());
		})

		// Home screen. Default to recipe view with some tweaks.
		this.get('#boot', function (context) {
			$('#nav-recipes').addClass('active');
			$('#navbar').show();
			loadRecipesView(context);
			$('#navbar').fadeIn(fadeTime);
			$('#add-item-btn').prop('href', '#newRecipeView').fadeIn(fadeTime);
		});

		// Recipe view.
	     this.get('#recipesView', function (context) {
	    	$('#nav-recipes').addClass('active');
	     	loadRecipesView(context);
	     	$('#add-item-btn').prop('href', '#newRecipeView').fadeIn(fadeTime);
	     	$('#btn-back').fadeOut(fadeTime);	
	     });

	     // Ingredients view.
	     this.get('#ingredientsView', function (context) {
	     	ingredientListController = eatfresh.newIngredientListController();
	     	ingredientListController.loadView(function (view) {
	     		context.app.swap(view);
	     	})

	     	$('#nav-ingredients').addClass('active');
	     	$('#add-item-btn').prop('href', '#newIngredientView').fadeIn(fadeTime);
	     	$('#btn-back').fadeOut('fast');	
	     });

	     // Planner view
	     this.get('#plannerView', function (context) {
	     	context.app.swap(ich.plannerView());
	     	$('#nav-planner').addClass('active');
	     	$('#add-item-btn').fadeOut('fast');
	     	$('#btn-back').fadeOut('fast');		     	
	     })

	     // New recipe view
	     this.get('#newRecipeView', function (context) {
	     	recipeController = eatfresh.newRecipeController();
	     	recipeController.loadView(function (view) {
	     		context.app.swap(view);
	     	});

	     	$('.nav li').removeClass('active');
	     	$('#add-item-btn').fadeOut('fast');
	     	$('#btn-back').prop('href', '#recipesView').fadeIn(fadeTime);
	     });

	     // New ingredient view
		 this.get('#newIngredientView', function (context) {
			ingredientController = eatfresh.newIngredientController();
			ingredientController.loadView(function (view) {
				context.app.swap(view);
			});

	     	$('.nav li').removeClass('active');
	     	$('#add-item-btn').fadeOut('fast');
	     	$('#btn-back').prop('href', '#ingredientsView').fadeIn(fadeTime);
	     });

	     this.post('#saveRecipe', function (context) {
	     	var formData = $(context.target).toObject();
	     	if(recipeController) {
	     		recipeController.saveRecipe(formData.recipe, function() {
	     			console.log('Successfully saved object: ' + JSON.stringify(formData));
	     			context.redirect('#recipesView');
	     		})
	     	} else {
	     		ui.showModalError("A fatal error occurred! Unable to continue. Error: No controller available.");
	     		// Try to fix it by routing the user to a place where the appropriate controller is created.
	     		context.redirect('#recipesView');
	     	}

     		console.log(JSON.stringify(formData));
	     });

	     this.post('#saveIngredient', function (context) {
	     	var formData = $(context.target).toObject();
	     	if(ingredientController) {
	     		ingredientController.saveIngredient(formData.ingredient, function () {
	     			console.log('Successfully saved object: ' + JSON.stringify(formData));
	     			context.redirect('#ingredientsView');
	     		});
	     	} else {
	     		ui.showModalError("A fatal error occurred! Unable to continue. Error: No controller available.");
	     		// Try to fix it by routing the user to a place where the appropriate controller is created.
	     		context.redirect('#ingredientsView');
	     	}
	     });

	     this.post('#checklogin', function(context) {
	     	console.log('Inside check login');
	     	// Check login here.
	     	context.app.swap(''); // clear screen.
	     	this.redirect('#boot');
	     });

	     this.post('#signup', function(context) {
	     	var formData = $(context.target).toObject();
	     	var user = new Parse.User();
	     	user.set('username', formData.email);
	     	user.set('password', formData.password);
	     	user.set('email', formData.email);

	     	user.signUp(null, {
	     		success: function (user) {
	     			ui.showModalSuccess("Account successfully created! Now go sign in!", function () {
	     				context.redirect('#signin');
	     			});
	     		},
	     		error: function (user, error)  {
	     			ui.showModalError('Unable to sign you up! Error: <br><br>' + error.message, function () {
	     				$('input', context.target).val('');
	     			});
	     		}
	     	})
	     })
	 });
})();