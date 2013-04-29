// Main application execution. Sets up routes and handles page swapping.
(function () {
	var fadeTime = 500;
	var ingredientController;
	var recipeController;
	var ingredientListController;
	var recipeListController;

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
				ui.showModalError(
					'We encountered a problem when loading site templates! Error: <br><br>' + error);
			});
	}

	var app = $.sammy('#app', function () {
		// cache some often accessed elements that never change.
		var navbar = $('#navbar');
		var recipesNavBtn = $('#nav-recipes');
		var ingredientsNavBtn = $('#nav-ingredients');
		var plannerNavBtn = $('nav-planner');
		var backBtn = $('#btn-back');
		var addItemBtn = $('#add-item-btn');

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
		}

		var loadRecipesView = function (context) {
			recipeListController = eatfresh.newRecipeListController();
	     	recipeListController.loadView(function(view) {
	     		context.app.swap(view);
	     	})
		}

		// Login screen.
		this.get('#signin', function (context) {
			navbar.hide();
			context.app.swap(ich.signinView());
		})

		this.get('#signup', function(context) {
			navbar.hide();
			context.app.swap(ich.signupView());
		})

		// Home screen. Default to recipe view with some tweaks.
		this.get('#boot', function (context) {
			recipesNavBtn.addClass('active');
			loadRecipesView(context);
			navbar.fadeIn(fadeTime);
			addItemBtn.prop('href', '#newRecipeView').fadeIn(fadeTime);
		})

		// Recipe view.
	     this.get('#recipesView', function (context) {
	    	recipesNavBtn.addClass('active');
	     	loadRecipesView(context);
	     	addItemBtn.prop('href', '#newRecipeView').fadeIn(fadeTime);
	     	backBtn.fadeOut(fadeTime);	
	     })

	     // Ingredients view.
	     this.get('#ingredientsView', function (context) {
	     	ingredientListController = eatfresh.newIngredientListController();
	     	ingredientListController.loadView(function (view) {
	     		context.app.swap(view);
	     	})

	     	ingredientsNavBtn.addClass('active');
	     	addItemBtn.prop('href', '#newIngredientView').fadeIn(fadeTime);
	     	backBtn.fadeOut('fast');	
	     })

	     // Planner view
	     this.get('#plannerView', function (context) {
	     	context.app.swap(ich.plannerView());
	     	plannerNavBtn.addClass('active');
	     	addItemBtn.fadeOut('fast');
	     	backBtn.fadeOut('fast');		     	
	     })

	     // New recipe view
	     this.get('#newRecipeView', function (context) {
	     	recipeController = eatfresh.newRecipeController();
	     	recipeController.loadView(function (view) {
	     		context.app.swap(view);
	     	});

	     	$('li', navbar).removeClass('active');
	     	addItemBtn.fadeOut('fast');
	     	backBtn.prop('href', '#recipesView').fadeIn(fadeTime);
	     })

	     // New ingredient view
		 this.get('#newIngredientView', function (context) {
			ingredientController = eatfresh.newIngredientController();
			ingredientController.loadView(function (view) {
				context.app.swap(view);
			});

	     	$('li', navbar).removeClass('active');
	     	addItemBtn.fadeOut('fast');
	     	backBtn.prop('href', '#ingredientsView').fadeIn(fadeTime);
	     })

	     this.post('#saveRecipe', function (context) {
	     	var formData = $(context.target).toObject();
	     	if(recipeController) {
	     		recipeController.saveRecipe(formData.recipe, function() {
	     			console.log('Successfully saved object: ' + JSON.stringify(formData));
	     			context.redirect('#recipesView');
	     		})
	     	} else {
	     		ui.showModalError(
	     			"A fatal error occurred! Unable to continue. Error: No controller available.", 
		     		function() {
		     			context.redirect('#recipesView');
		     		});
	     	}

     		console.log(JSON.stringify(formData));
	     })

	     this.post('#saveIngredient', function (context) {
	     	var formData = $(context.target).toObject();
	     	if(ingredientController) {
	     		ingredientController.saveIngredient(formData.ingredient, function () {
	     			context.redirect('#ingredientsView');
	     		});
	     	} else {
	     		ui.showModalError(
	     			"A fatal error occurred! Unable to continue. Error: No controller available.",
	     			function () {
	     				context.redirect('#ingredientsView');
	     			});
	     	}
	     })

	     this.post('#checklogin', function(context) {
	     	var target = $(context.target);
	     	var loginBtn = $('#login-btn', target);
	     	loginBtn.html('<i class="icon-spinner icon-spin"></i> Signing in...');

	     	var formData = target.toObject();
	     	Parse.User.logIn(formData.email, formData.password, {
	     		success: function (user) {
	     			context.redirect('#boot');
	     		},
	     		error: function(user, error) {
	     			loginBtn.html('<i class="icon-signin"></i> Sign in');
	     			ui.showModalError('Unable to sign in! Error: <br><br>' + error.message, 
		     			function () {
		     				$('#password', context.target).val('');
		     			})
	     		}
	     	});
	     })

	     this.post('#signup', function(context) {
	     	var target = $(context.target);
	     	var signupBtn = $('#signup-btn', target);
	     	signupBtn.html('<i class="icon-spinner icon-spin"></i> Please wait...');

	     	var formData = target.toObject();
	     	var user = new Parse.User();
	     	user.set('username', formData.email);
	     	user.set('password', formData.password);
	     	user.set('email', formData.email);

	     	user.signUp(null, {
	     		success: function (user) {
	     			ui.showModalSuccess("Account successfully created! Now go sign in!", 
		     			function () {
		     				context.redirect('#signin');
		     			});
	     		},
	     		error: function (user, error)  {
	     			signupBtn.html('<i class="icon-heart"></i> Sign up!');
	     			ui.showModalError('Unable to sign you up! Error: <br><br>' + error.message, 
		     			function () {
		     				$('input', context.target).val('');
		     			});
	     		}
	     	})
	     })
	 });
})();