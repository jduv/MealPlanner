// Require tested modules
require('../Ui/js/mealplanner-1.0.js');
var chai = require('chai');

suite('Array', function(){
  suite('#indexOf()', function(){
    test('should return -1 when not present', function(){
      chai.assert.strictEqual(-1, [1,2,3].indexOf(4));
    });
  });
});

suite('test', function() {

	var i = 0;
	var g = {};

	setup(function() {
		console.log('in setup');
	 	g = { a : 'test', b : i++ };
	});

	console.log(g);

	test('should work', function() {
		chai.assert.strictEqual(g.a, 'test');
		chai.assert.strictEqual(g.b, 0);
	});

	test('should also work', function() {
		chai.assert.strictEqual(g.a, 'test');
		chai.assert.strictEqual(g.b, 1);
	});
});