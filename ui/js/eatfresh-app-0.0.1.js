// Some basic SPA functions that don't really belong anywhere.
var ui = (function () {

	// Creates dom nodes from an array of arguments and some selector functions. Mainly used
	// when creating form elements like <option></option> under a select, or checkboxes.
	var thingify = function (args, creator) {
		args = {
				items : args.items || [],
				textSelector : args.textSelector || function (item) { return item },
				valueSelector : args.valueSelector || function (item) {},
				idSelector : args.idSelector || function () {},
				nameSelector : args.nameSelector || function () {}
		};

		var items = [];
		_.forEach(args.items, function (value, key, collection) {
			items.push(creator(key, value, args));
		})

		return items;
	}

	return {
		showModalError : function (body, onHide)
		{
			var modal = $('#error-modal');
			$('#error-modal-msg', modal).html(body);
			modal.modal('show');

			if(onHide) {
				modal.unbind('hidden').on('hidden', onHide);
			}

			return modal;
		},
		showModalLoading : function () {
			// var modal = $('#loading-modal');
			// modal.modal('show');
			// return modal;
		},
		hideModalLoading : function () {
			// var modal = $('#loading-modal');
			// modal.modal('hide');
			// return modal;
		},
		showModalSuccess : function (body, onHide) {
			var modal = $("#success-modal");
			$('#success-modal-msg', modal).html(body);
			modal.modal('show');

			if(onHide) {
				modal.unbind('hidden').on('hidden', onHide);
			}

			return modal;
		},
		checkboxify : function (args) {			
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
		optionify : function (args) {
			return thingify(args, function (index, item, options) {
				return $('<option></option>')
				.attr('value', options.valueSelector(item))
				.append(options.textSelector(item));
			});
		}
	};
}());

// Top level object. Creates controllers and such.
var eatfresh = (function () {

	// Static Parse objects
	var Conversion = Parse.Object.extend('Conversion');
	var UnitType = Parse.Object.extend('UnitType');
	var MeasurementType = Parse.Object.extend('MeasurementType');
	var Ingredient = Parse.Object.extend('Ingredient');
	var Recipe = Parse.Object.extend('Recipe');

	// utility function for loading required static data.
	function loadMeasurementData (success) {
		var measurementTypes = {};
		var query = new Parse.Query(MeasurementType);
		query.ascending('name');
		query.find({ 
			success : function (data) {
				for(var i = 0; i < data.length; i++) {
					measurementTypes[data[i].id] = data[i];
				}
				loadUnitTypes(measurementTypes, success);
			},
			error : function (error) {
				ui.hideModalLoading();
				ui.showModalError('Unable to fetch required data. Error: ' + error.message);
			}
		});

	}

	// utility function for loading unit types
	function loadUnitTypes (measurementTypes, success) {
		var query = new Parse.Query(UnitType);
		query.find({
			success : function (data) {
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
				success(measurementTypes);
			},
			error : function (error) {
				ui.hideModalLoading();
				ui.showModalError('Unable to fetch required data. Error: ' + error.message);
			}
		})
	}

	function unitTypeTextSelector(item) {
		return item.get('name');
	}

	function unitTypeValueSelector(item) {
		return item.id;
	}

	function measurementTypeTextSelector(item) {
		return item.get('name');
	}

	function measurementTypeValueSelector(item) {
		return item.id;
	}

	// The facade
	var facade = {
		newRecipeController : function () {
			var ingredientCount = 0;
			var view = ich.newRecipeView();
			var ingredients;
			var ingredientNames;
			var measurementTypes;

			// configure the type-ahead
			var wireAutoComplete = function (id)
			{
				$('#ingredient-autocomplete-' + id, view)
				.typeahead({ 
					source : function (query, process) { return ingredients; },
					matcher : function(item) { 
						var itemName = item.get('name');
					 	return ~itemName.toLowerCase().indexOf(this.query.toLowerCase()) 
					},
					sorter : function(items) {
						var beginswith = []
						, caseSensitive = []
						, caseInsensitive = []
						, item;

						var itemName;
						while (item = items.shift()) {
							itemName = item.get('name');
					        if (!itemName.toLowerCase().indexOf(this.query.toLowerCase())) {
					        	beginswith.push(item);
					        }
					        else if (~itemName.indexOf(this.query)) { 
					        	caseSensitive.push(item);
					        }
					        else { 
					        	caseInsensitive.push(item);
					        }
				      	}

				      return beginswith.concat(caseSensitive, caseInsensitive)
					},
					updater : function(item) { 
						var ingredientId = $('#ingredient-id-' + counter, view);
						var measurementSelect = $('#ingredient-measurements-' + counter, view);
						var id = item.attr('id');
						var ingredient = _.find(ingredients, { 'id' : id });
						var supportedMeasurementTypes = _.map(ingredient.get('supportedMeasurementTypes'), function(item) {
							return measurementTypes[item];
						});

						// set id.
						ingredientId.val(ingredient.id);

						// build measurements list.
						var list = ui.optionify({
							items : supportedMeasurementTypes,
							valueSelector : measurementTypeValueSelector,
							textSelector : measurementTypeTextSelector
						});

						var defaultOption = $('option', measurementSelect);
						measurementSelect.html('');
						measurementSelect.append(defaultOption);
						measurementSelect.append(list);

						// bind to change event
						measurementSelect.change(function () {
							var selectedOption = $(':selected', measurementSelect);
							var unitTypesSelect = $('#ingredient-units-' + counter);
							$('#ingredient-amount-' + counter).removeAttr('disabled');

							// populate 
							var measurementType = measurementTypes[selectedOption.val()];
							if(measurementType) {
								var list = ui.optionify({
									items : measurementType.unitTypes,
									valueSelector : unitTypeValueSelector,
									textSelector : unitTypeTextSelector
								});

								var defaultOption = $('option[value="default"]', unitTypesSelect);
								unitTypesSelect.html('');
								unitTypesSelect.append(defaultOption);
								unitTypesSelect.append(list);
								unitTypesSelect.selectmenu('enable');
								unitTypesSelect.selectmenu('refresh');
							}
						});

						// tell jquery mobile to refresh itself.
						measurementSelect.selectmenu('enable');
						measurementSelect.selectmenu('refresh');
						return item.attr('data-value'); 
					},
					highlighter : function(item) {
						var itemName = item.get('name');
						var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
						return itemName.replace(
					      	new RegExp('(' + query + ')', 'ig'), function ($1, match) {
					        	return '<strong>' + match + '</strong>';
				      	});
					},
					itemRenderer : function(template, item) {
						return template.attr('data-value', item.get('name')).attr('id', item.id);
					},
					items : 10,
					minLength : 2,
				});
			}

			// Wires swipe delete.
			var wireSwipeDelete = function (id, ingredientListItem, list) {
				// handle deleting the first time.

				ingredientListItem.on('swiperight', function() {
					var deleteButton = $('#delete-ingredient-' + id, ingredientListItem);
					deleteButton.click(function () {
						ingredientListItem.slideUp('fast', function() { 
							ingredientListItem.remove();
						});
						list.listview('refresh');
					})

					deleteButton.slideDown();
					ingredientListItem.click(function() {
						deleteButton.hide();
						ingredientListItem.unbind('click')
					})
				});
			}

			var controller = {
				addIngredientToView : function () {
					var list = $('#recipe-ingredient-list', view);
					var ingredient = ich.newIngredient({ id : ingredientCount });
					ingredient.hide();
					list.append(ingredient);

					// Wire auto-complete box
					wireAutoComplete(ingredientCount);

					// Wire swipe-delete
					wireSwipeDelete(ingredientCount, ingredient, list);

					// If we're not adding the first ingredient...
					if(ingredientCount > 0) {
						list.listview('refresh').trigger('create');
						ingredient.slideDown('fast');
						list.listview('refresh');
					} else {
						ingredient.show();
					}
					
					ingredientCount++;
				},
				saveRecipe : function (jsonFormData, callback) {
					var recipe = new Recipe();
					recipe.set('name', jsonFormData.name);
					recipe.set('servingSize', jsonFormData.servingSize);
					recipe.set('directions', jsonFormData.directions);
					recipe.save(null, {
						success : callback,
						error : function(error) { ui.showModalError('Unable to save the recipe. Error: ' + error.message) }
					});
				},
				// match the other load-view calls, even though the callback is unused.
				loadView : function (callback) {
					// fetch all the ingredient names for the auto-completes
					var query = new Parse.Query(Ingredient);
					query.ascending('name');
					query.find({
						success : function (data) {
							ingredients = data;
							ingredientNames = _.map(data, function (item) { return item.get('name') });
						},
						error : function(error) { ui.showModalError('Unable to fetch required data. Error: ' + error.message) }
					})

					// fetch measurement types
					loadMeasurementData(function (data) {
						measurementTypes = data;
						callback(view);
					})
				}
			};

			// Wire up stuff.
			$('#addIngredientToRecipe', view).unbind('click').click(function () { controller.addIngredientToView() });
			controller.addIngredientToView(); // add the first ingredient.
			return controller;
		},
		newIngredientController : function () {
			var view = ich.newIngredientView();
			var measurementTypesElement = $('#measurement-types', view);
			var conversionsList = $('#conversions-list', view);
			var ingredient = Parse.Object.extend('Ingredient');
			var measurementTypes;

			// This closure maintains state for the conversion views.
			var createConversionViewGenerator = function () {
				var id = 0;

				return {
					generateConversionView : function (convertFrom, convertTo) {
						var view;
						if(convertFrom && convertTo) {
							view = ich.conversionView({ 
										id : id,
										convertFrom : convertFrom.get('name'), 
										convertTo : convertTo.get('name')
									});

							$('#fromUnits', view).append(
								ui.optionify({
									items : convertFrom.unitTypes,
									textSelector : unitTypeTextSelector,
									valueSelector : unitTypeValueSelector
								}));

							$('#toUnits', view).append(
								ui.optionify({
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

			// Handles all those nasty conversion type menus.
			function handleConversions () {
				var checked = $('input:checked', measurementTypesElement);
				var viewGenerator = createConversionViewGenerator();

				// A peculiar way of handling this problem, but it's reasonable. The case statements 
				// represent the number of checkboxes checked, and we'll build out the view based on that.
				switch(checked.length) {
					// two checkboxes checked, create a conversion from A to B.
					case 2:
						var convertFrom = measurementTypes[checked.eq(0).attr('value')];
						var convertTo = measurementTypes[checked.eq(1).attr('value')];
						var view = viewGenerator.generateConversionView(convertFrom, convertTo);

						if(view) {
							conversionsList.html(view).trigger('create'); // force jqm to re-parse the element
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

			var saveChildren = function (jsonFormData, ingredient, callback) {
				// Create conversions
				if(jsonFormData.conversions) {
					// Execute this when all our conversions have saved.
					var done = _.after(jsonFormData.conversions.length, callback);
					var conversionRel = ingredient.relation("conversions");
					_.forEach(jsonFormData.conversions, function (toBuild) {
						toSave = buildConversion(toBuild);
						toSave.save(null, {
							success : function (data) {
								conversionRel.add(data);
								done();
							},
							error : function (error) { ui.showModalError('Unable to save the conversion. Error: ' + error.message) }
						});
					})
				} else {
					callback();
				}
			}

			var buildConversion = function (currentItem, parent) {
				var fromUnits = new UnitType();
				var toUnits = new UnitType();
				fromUnits.id = currentItem.convertFromUnits;
				toUnits.id = currentItem.convertToUnits;

				// Build the conversion object
				conversion = new Conversion();
				conversion.set('fromAmount', currentItem.convertFromAmount);
				conversion.set('toAmount', currentItem.convertToAmount);
				conversion.set('fromUnits', fromUnits);
				conversion.set('toUnits', toUnits);

				return conversion;
			}

			// Create the controller.
			var controller =  {
				loadView : function (callback) {
					ui.showModalLoading();
					loadMeasurementData(function (data) {
						// Assign to module level variable.
						measurementTypes = data;
						var list = ui.checkboxify({
							items : measurementTypes,
							textSelector : function (measurementType) {
								return measurementType.get('name');
							},
							valueSelector : function (measurementType) {
								return measurementType.id;
							},
							nameSelector : function (measurementType) {
								return 'ingredient.supportedMeasurementTypes[]';
							}
						});

						measurementTypesElement.html(list);
						$('input:checkbox', view).click(handleConversions);
						ui.hideModalLoading();
						callback(view);
					});
				},
				saveIngredient : function (jsonFormData, callback) {
					var toSave = new Ingredient();
					toSave.set('name', jsonFormData.name);

					if(jsonFormData.brand) {
						toSave.set('brand', jsonFormData.brand);
					}

					// Create measurement type relationships.
					var supportedMeasurementTypes = [];
					for(var i = 0; i < jsonFormData.supportedMeasurementTypes.length; i++)
					{
						var measurementType = measurementTypes[jsonFormData.supportedMeasurementTypes[i]];
						if(measurementType) {
							supportedMeasurementTypes.push(measurementType.id);
						}
					}

					toSave.set('supportedMeasurementTypes', supportedMeasurementTypes);

					// Handle child objects, save the main object, then return.
					saveChildren(jsonFormData, toSave, function () {
						toSave.save(null, {
							success : function (data) {
								callback();
							},
							error : function (error) { ui.showModalError('Unable to save the ingredient. Error: ' + error.message) }
						});
					});
				}
			}

			return controller;
		},
		newIngredientListController : function () {
			var view = ich.ingredientListView();
			var ingredientList = $('#ingredient-list-view', view);

			return {
				loadView : function (callback) {
					var Ingredient = Parse.Object.extend('Ingredient');
					var query = new Parse.Query(Ingredient);
					query.ascending('name');
					query.find({
						success : function (data) {
							for(var i = 0; i < data.length; i++) {
								var ingredient = ich.ingredientListItem({
									name : data[i].get('name'),
									brand : data[i].get('brand')
								});
								ingredientList.append(ingredient);
							}

							callback(view);
						},
						error : function (error) { ui.showModalError('Unable to fetch the ingredients list. Error: ' + error.message) }
					});
				}
			};

			return controller;
		},
		newRecipeListController : function () {
			var view = ich.recipeListView();
			var recipeList = $('#recipe-list-view', view);

			return {
				loadView : function (callback) {
					var Recipe = Parse.Object.extend('Recipe');
					var query = new Parse.Query(Recipe);
					query.ascending('name');
					query.find({
						success : function (data) {
							for(var i = 0; i < data.length; i++) {
								var recipe = ich.recipeListItem({
									name : data[i].get('name'),
									servingSize : data[i].get('servingSize')
								});
								recipeList.append(recipe);
							}

							callback(view);
						},
						error : function (error) { ui.showModalError('Unable to fetch the recipe list. Error: ' + error.message) }
					});
				}
			};

			return controller;
		}
	};

	return facade;
}());