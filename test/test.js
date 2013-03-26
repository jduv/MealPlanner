// Require tested modules
require('../Ui/js/MealPlanner-1.0.js');
var chai = require('chai');

suite('Array', function(){
  setup(function(){
  	// ...
  });

  suite('#indexOf()', function(){
    test('should return -1 when not present', function(){
      chai.assert.strictEqual(-1, [1,2,3].indexOf(4));
    });
  });
});