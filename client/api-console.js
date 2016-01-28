(function(){


var apiConsole = angular.module('ApiConsole', ['Account']);

apiConsole.controller('ApiConsoleCtrl', ['$scope', 'AccountService', function($scope, AccountService) {

  $scope.tab = ['api', 'edit'][0];

  //initialize
  AccountService.getAccountFromSession().then(function(result) {
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

  $scope.isApiOwner = function() {
    var isOwner = true;
    return isOwner && $scope.account;
  }

}])

})();