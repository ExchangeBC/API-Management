(function(){

angular.module('ApiList', ['angularSpinner', 'ngResource', 'ngSanitize', 'Account'])
.factory('ProgramListService', ['$resource', function($resource) {
    return $resource('listing.json');
}])
.controller('ApiListCtrl', 
  ['$scope', 
  '$location',
  'usSpinnerService', 
  '$q', 
  'ProgramListService', 
  'AccountService',
  'ApiService',
    function($scope, $location, usSpinnerService, $q, ProgramListService, AccountService, ApiService) {

    // Array of apis
    $scope.apis = []
    $scope.apisLoaded = false

    $scope.predicate = 'title';
    $scope.predicateTitle = 'Title A-Z'

    // Array of alerts
    $scope.alerts = []

    //initialize
    AccountService.getAccount().then(function(result) {      
      $scope.account = result;
    });

    $scope.login = function() {
      console.log("login");
      //SessionService.setAccessToken("dummy token");
      $scope.startGithubLogin();
    }

    $scope.logout = function() {
      window.location = "./logout"
    }

    $scope.startGithubLogin = function() {
      window.location = "./auth/github"
    }

    $scope.startSpin = function(){
        usSpinnerService.spin('spinner-1')
    }

    $scope.stopSpin = function(){
        usSpinnerService.stop('spinner-1')
    }

    var apiListDeferred = $q.defer()
    var apiPromise = apiListDeferred.promise

    apiPromise.then(
        function(){
            usSpinnerService.stop('spinner-apis')
        }
    )

    $scope.goToApi = function(swaggerUrl) {
      ApiService.setSelectedSwaggerUrl(swaggerUrl);
      $location.path("/console");
    }

    ProgramListService.get({}, function(data) {
        $scope.apis = data.result.packages
        apiListDeferred.resolve("# apis:"+data.result.packages.length)
        $scope.apisLoaded = true

    }, function(error) {
        $scope.alerts.push({ type: 'warning', msg: 'There was an error accessing data from <strong>' + error.config.url + '</strong>.' })
        apiListDeferred.resolve('error retrieving apis for  ' + error.config.url)
        $scope.apisLoaded = true
    })
}])

})();
