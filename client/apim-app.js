var apimApp = angular.module('apim-app', [
  'ngRoute',
  'ApiConsole',
  'ApiList',
  'angularSpinner'
]);

apimApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/list', {
        templateUrl: 'view-list.html',
        controller: 'ApiListCtrl'
      }).
      when('/console', {
        templateUrl: 'view-console.html',
        controller: 'ApiConsoleCtrl'
      }).
      otherwise({
        redirectTo: '/list'
      });

      // use the HTML5 History API
      $locationProvider.html5Mode(true);
  }]);


apimApp.factory('ApiService', [function(){
  return {
    
    selectedSwaggerUrl: null,

    setSelectedSwaggerUrl: function(url) {
      this.selectedSwaggerUrl = url;
    },
    getSelectedSwaggerUrl: function() {
      return this.selectedSwaggerUrl;
    },
    
    setView: function(viewName) {
      view = "list"
    }
  };
}]);


apimApp.controller('ApimCtrl', 
  ['$scope',
   '$location',
  'AccountService',
  function($scope, $location, AccountService) {

    $scope.loginInProgress = false;

    $scope.getView = function() {
      if ($location.path() == "/list") {
        return "list"
      }
      else if ($location.path() == "/console") {
        return "console";
      }

      return null;
    };

    $scope.login = function() {
      $scope.loginInProgress = true;
      $scope.startGithubLogin();
    }

    $scope.logout = function() {
      window.location = "./logout"
    }

    $scope.startGithubLogin = function() {
      window.location = "./auth/github"
    }

    //init
    AccountService.getAccount("ApimCtrl").then(function(result) {      
      $scope.account = result;
    });

}]);