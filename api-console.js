(function(){

angular.module('ApiConsole', ['ngSanitize', 'swaggerUi'])

.config(function($locationProvider) {
    // use the HTML5 History API
    $locationProvider.html5Mode(true);
})

// This service reads data from the query string into an object.
.service('QueryStringService', function ($location) {
    this.getParams = function() {
        var qs = $location.search();
        return qs;
    };
})

.controller('ApiConsoleCtrl', ['$scope', '$location', "QueryStringService",
    function($scope, $location, QueryStringService) {

      var queryStringParams = QueryStringService.getParams();

      // init form
      $scope.isLoading = false;
      
      $scope.errorMsg = null;
      if (queryStringParams["swaggerUrl"] != null && queryStringParams["swaggerUrl"] != ""){
        $scope.swaggerUrl = queryStringParams["swaggerUrl"];
      }
      else{
        $scope.errorMsg = "Parameter swaggerUrl not specified";
        console.log(queryStringParams)
      }
      
      // error management
      $scope.myErrorHandler = function(data, status){
          $scope.errorMsg = "Unable to access swagger: '"+$scope.swaggerUrl+"'";
      };
}])

})();