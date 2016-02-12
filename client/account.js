(function(){

var accountModule = angular.module('Account', ['ngCookies']);

accountModule.factory('AccountService', ['$q', '$http', function($q, $http){

  return {

    //returns a promise
    getAccountFromSession: function(url) {
      return $http({
        url: "./api/account",
        method: 'GET',
        headers: {
        "Cache-control": "no-cache"
        },
        transformResponse: null,
      })
        .then(function(response) {
            jsonData = JSON.parse(response.data)
            if (jsonData.username) {
              return jsonData;
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