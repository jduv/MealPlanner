var controllerFactory = (function () {
	return {
		newRecipeViewController : function() {
			var ingredientCount = 0;
			var view = ich.newRecipeView();

			var controller = {
				addIngredient : function () {
					if(view)
					{
						var ingredient = ich.newIngredient({ id : ingredientCount });
						view.find("#ingredients-list").append(ingredient).trigger("create");

						// If we're not adding the first ingredient...
						if(ingredientCount > 0) {
							ingredient.hide();
							ingredient.slideDown("fast");
						}

						ingredientCount++;
					}
				},
				submitRecipe : function () {
					// Write me.
				},
				getNewRecipeView : function () {
					return view;
				}
			};

			// Wire up stuff.
			view.find("#addIngredientToRecipe").unbind("click").click(function() { controller.addIngredient() });
			controller.addIngredient(); // add the first ingredient.
			return controller;
		},
		newIngredientViewController : function() {
			var view = ich.newIngredientView();
			var checkboxes = view.find("input:checkbox");
			var ingredient = {};

			var controller =  {
				getNewIngredientView : function() {
					return view;
				},
				submitIngredient : function () {
					// write me.
				}
			}

			// internal helper functionthat adjusts the conversion view to match the checkboxes.
			var adjustConversionsView = function() {
				console.log("craziness handled.");
				view.find("#conversions-list").append(ich.conversionView({ 
					convertFrom : "quantity",
					convertTo : "volume"
				})).trigger("create");
			}

			checkboxes.unbind("click").click(adjustConversionsView);
			return controller;
		}
	};
}());