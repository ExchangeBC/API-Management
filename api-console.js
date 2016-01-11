(function(){


angular.module('ApiConsole', ['ngSanitize'])

.config(function($locationProvider) {
    // use the HTML5 History API
    $locationProvider.html5Mode(true);
})

// This service reads data from the query string into an object.
.service('QueryStringService', function ($location) {

    this.getParams = function() {
        var qs = $location.search();
        //$location.url($location.path()).replace();
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

        var swaggerUi = new SwaggerUi({
          url:$scope.swaggerUrl,
          dom_id:"swagger-ui-container"
        });

        swaggerUi.load();
      }



      
}])

})();