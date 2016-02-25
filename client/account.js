(function(){

var accountModule = angular.module('Account', ['ngCookies']);

accountModule.factory('AccountService', ['$q', '$http', function($q, $http){

  return {

    //returns a promise
    getAccount: function(url) {
      return $http({
        url: "./api/account",
        method: 'GET',
        //cache: "true",
        headers: {
        "Cache-control": "no-cache"
        },
        transformResponse: null,
      })
        .then(function(response) {
            jsonData = JSON.parse(response.data);       
            return jsonData;
        }, function(response) {
          // something went wrong
          return $q.reject(response.data);
        });
    },

  };
 
}]);


})();