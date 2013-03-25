
// Use Parse.Cloud.define to define as many cloud functions as you want.
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
