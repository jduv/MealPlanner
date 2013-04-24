// Some basic SPA functions that don't really belong anywhere.
var ui = (function() {

	// Creates dom nodes from an array of arguments and some selector functions. Mainly used
	// when creating form elements like <option></option> under a select, or checkboxes.
	var thingify = function(args, creator) {
		args = {
				items : args.items || [],
				textSelector : args.textSelector || function() {},
				valueSelector : args.valueSelector || function() {},
				idSelector : args.idSelector || function() {},
				nameSelector : args.nameSelector || function() {}
		};

		var items = [];
		_.forEach(args.items, function(value, key, collection) {
			items.push(creator(key, value, args));
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
			return thingify(args, function (index, item, options) {
				var label = $('<label></label>')
				.addClass('label-checkbox');

				var input = $('<input />')
				.attr('id', options.idSelector(item))
				.attr('type', 'checkbox')
				.attr('name', options.nameSelector(item))
				.attr('value', options.valueSelector(item));

				label.append(input).append(options.textSelector(item));
				return label;
			});
		},
		optionify : function(args) {
			return thingify(args, function(index, item, options) {
				return $('<option></option>')
				.attr('value', options.valueSelector(item))
				.append(options.textSelector(item));
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
				var viewGenerator = createConversionViewGenerator();

				// A peculiar way of handling this problem, but it's readable. The case statements represent
				// the number of checkboxes checked, and we'll build out the view based on that.
				switch(checked.length) {
					// two checkboxes checked, create a conversion from A to B.
					case 2:
						var convertFrom = measurementTypes[checked.eq(0).attr('value')];
						var convertTo = measurementTypes[checked.eq(1).attr('value')];
						var view = viewGenerator.generateConversionView(convertFrom, convertTo);

						if(view) {
							conversionsList.html(view).trigger('create'); // force jqm to re-parse th element
							conversionsList.show();
						}

						break;
					case 3:
						var convertA = measurementTypes[checked.eq(0).attr('value')];
						var convertB = measurementTypes[checked.eq(1).attr('value')];
						var convertC = measurementTypes[checked.eq(2).attr('value')];

						var view1 = viewGenerator.generateConversionView(convertA, convertB);
						var view2 = viewGenerator.generateConversionView(convertB, convertC);
						var view3 = viewGenerator.generateConversionView(convertC, convertA);

						if(view1 && view2 && view3) {
							conversionsList.html('');
							conversionsList.append(view1);
							conversionsList.append(view2);
							conversionsList.append(view3);
							conversionsList.trigger('create'); // force jqm to re-parse the element
							conversionsList.show();
						}

						break;
					default:
							conversionsList.html('');
							conversionsList.hide();
				}
			}

			// This closure maintains state for the conversion views.
			var createConversionViewGenerator = function() {
				var id = 0;

				// Tells optionify where the text for a unit type is
				function unitTypeTextSelector(item) {
					return item.get('name');
				}

				// Tells optionify where the value for a unit type is.
				function unitTypeValueSelector(item) {
					return item.id;
				}

				return {
					generateConversionView : function(convertFrom, convertTo) {
						var view;
						if(convertFrom && convertTo) {
							view = ich.conversionView({ 
										id : id,
										convertFrom : convertFrom.get('name'), 
										convertTo : convertTo.get('name')
									});

							$('#fromUnits', view).append(
								ui.optionify({
									id : id,
									items : convertFrom.unitTypes,
									textSelector : unitTypeTextSelector,
									valueSelector : unitTypeValueSelector
								}));

							$('#toUnits', view).append(
								ui.optionify({
									id : id,
									items : convertTo.unitTypes,
									textSelector : unitTypeTextSelector,
									valueSelector : unitTypeValueSelector
								}))
						}

						id++; // increment count.
						return view;
					}
				}

			};

			// Create the controller.
			var controller =  {
				loadView : function(callback) {
					ui.showModalLoading();
					loadMeasurementData(function() {
						var list = ui.checkboxify({
							items : measurementTypes,
							textSelector : function(measurementType) {
								return measurementType.get('name');
							},
							valueSelector : function(measurementType) {
								return measurementType.id;
							},
							nameSelector : function(measurementType) {
								return 'ingredient.supportedMeasurementTypes[]';
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