(function(){

var accountModule = angular.module('Account', ['ngCookies']);

accountModule.factory('AccountService', ['$q', '$http', function($q, $http){

  return {

      //returns a promise with
      getAccountFromSession: function() {
        var maxResults = 1;
        return $http.get("./api/account")
          .then(function(response) {
            if (typeof response.data === 'object' && response.data.username) {
              return response.data;
            }

            // invalid response, or no matches
            return $q.reject(response.data);

          }, function(response) {
            // something went wrong
            return $q.reject(response.data);
          });
      },
  };
 
}]);


})();