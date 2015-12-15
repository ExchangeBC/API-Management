(function(){

angular.module('ApiList', ['angularSpinner', 'ngResource', 'ngSanitize'])
.factory('ProgramListService', ['$resource', function($resource) {
    return $resource('http://sandbox.apis.gov.bc.ca/bcdc/3/action/group_show?id=bcdevexchange');
}])
.controller('ApiCtrl', ['$scope', 'usSpinnerService', '$q', 'ProgramListService', 
    function($scope, usSpinnerService, $q, ProgramListService) {

    // Array of apis
    $scope.apis = []
    $scope.apisLoaded = false
    $scope.predicateTitle = ''

    // Array of alerts
    $scope.alerts = []

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