// Some basic SPA functions that don't really belong anywhere.
var ui = (function() {

	// Creates dom nodes from an array of arguments and some selector functions. Mainly used
	// when creating form elements like <option></option> under a select, or checkboxes.
	var thingify = function(args, creator) {
		args = {
				items : args.items || [],
				textSelector : args.textSelector || function () {},
				valueSelector : args.valueSelector || function () {},
				idSelector : args.idSelector || function() {}
		};

		var items = [];
		_.forEach(args.items, function(value, key, collection) {
			items.push(creator(key, value));
		})

		return items;
	}

	return {
		showModalError : function(body)
		{
			var element = $('#error-modal');
			$('#error-modal-msg', element).html(body);
			element.modal('show');
		},
		showModalLoading : function() {
			$('#loading-modal').modal({ backdrop : 'static', keyboard : false });
		},
		hideModalLoading : function() {
			$('#loading-modal').modal('hide');
		},
		checkboxify : function(args) {			
			return thingify(args, function (index, item) {
				var label = $('<label></label>')
				.addClass('label-checkbox');

				var input = $('<input />')
				.attr('id', args.idSelector(item))
				.attr('type', 'checkbox');

				label.append(input).append(args.textSelector(item));
				return label;
			});
		},
		optionify : function(args) {
			return thingify(args, function(index, item) {
				return $('<option></option>', { value : args.valueSelector(item), text : args.textSelector(item)});
			});
		}
	};
}());

// Top level object. Creates controllers and such.
var eatfresh = (function () {
	var facade = {
		newRecipeViewController : function() {
			var ingredientCount = 0;
			var view = ich.newRecipeView();

			var controller = {
				addIngredientToView : function () {
					if(view)
					{
						var ingredient = ich.newIngredient({ id : ingredientCount });
						$('#ingredients-list', view).append(ingredient).trigger('create');

						// If we're not adding the first ingredient...
						if(ingredientCount > 0) {
							ingredient.hide();
							ingredient.slideDown('fast');
						}
						ingredientCount++;
					}
				},
				// match the other load-view calls, even though the callback is unused.
				loadView : function (callback) {
					callback(view);
				}
			};

			// Wire up stuff.
			$('#addIngredientToRecipe', view).unbind('click').click(function() { controller.addIngredientToView() });
			controller.addIngredientToView(); // add the first ingredient.
			return controller;
		},
		newIngredientViewController : function() {
			var view = ich.newIngredientView();
			var measurementTypesElement = $('#measurement-types', view);
			var conversionsList = $('#conversions-list', view);
			var ingredient = Parse.Object.extend('Ingredient');
			var measurementTypes = {};

			// utility function for loading required static data.
			function loadMeasurementData(success) {
				var MeasurementType = Parse.Object.extend('MeasurementType');
				var query = new Parse.Query(MeasurementType);
				query.ascending('name');
				query.find({ 
					success : function(data) {
						for(var i = 0; i < data.length; i++) {
							measurementTypes[data[i].id] = data[i];
						}
						loadUnitTypes(success);
					},
					error : function(error) {
						ui.hideModalLoading();
						ui.showModalError('Unable to fetch required data. Error: ' + error.message);
					}
				});

			}

			// utility function for loading unit types
			function loadUnitTypes(success) {
				var UnitType = Parse.Object.extend('UnitType');
				var query = new Parse.Query(UnitType);
				query.find({
					success : function(data) {
						for(var i = 0; i < data.length; i++)
						{
							var mType = measurementTypes[data[i].get('measurementType').id];
							if(mType)
							{
								if(typeof mType.unitTypes == 'undefined') {
									mType.unitTypes = [];
								}
								mType['unitTypes'].push(data[i]);
							}
						}
						success()
					},
					error : function(error) {
						ui.hideModalLoading();
						ui.showModalError('Unable to fetch required data. Error: ' + error.message);
					}
				})
			}

			// Handles all those nasty conversion type menus.
			function handleConversions() {
				var checked = $('input:checked', measurementTypesElement);

				// A peculiar way of handling this problem, but it's readable. The case statements represent
				// the number of checkboxes checked, and we'll build out the view based on that.
				switch(checked.length) {
					// two checkboxes checked, create a conversion from A to B.
					case 2:
						var convertFrom = measurementTypes[checked.eq(0).attr('id')];
						var convertTo = measurementTypes[checked.eq(0).attr('id')];

						if(convertFrom && convertTo)
						{
							var view = ich.conversionView({ 
								convertFrom : convertFrom.get('name'), 
								convertTo : convertTo.get('name')
							});

							conversionsList.html(view);
							conversionsList.show();
						}

						break;
						default:
							conversionsList.html('');
							conversionsList.hide();
				}
			}

			function generateConversionView(convertFrom, convertTo) {
				var view;
				if(convertFrom && convertTo) {
					view = ich.conversionView({ 
								convertFrom : convertFrom.get('name'), 
								convertTo : convertTo.get('name')
							});
				}
				return view;
			}

			// Create the controller.
			var controller =  {
				loadView : function(callback) {
					ui.showModalLoading();
					loadMeasurementData(function() {
						var list = ui.checkboxify({
							items : measurementTypes,
							idSelector : function (item) {
								return item.id;
							},
							textSelector : function (item) {
								return item.get('name');
							}
						});

						measurementTypesElement.html(list);
						$('input:checkbox', view).click(handleConversions);
						ui.hideModalLoading();
						callback(view);
					});
				}
			}

			return controller;
		}
	};

	return facade;
}());