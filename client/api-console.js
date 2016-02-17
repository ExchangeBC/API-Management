(function(){


var apiConsole = angular.module('ApiConsole', ['angularSpinner', 'Account', 'ngSanitize']);

// Services
// --------------------------------------------------------------------------

apiConsole.factory('DownloadService', ['$http', '$q', function($http, $q){
  return {

    //returns a promise
    getUrl: function(url) {
      
      return $http({
        url: url,
        method: 'GET',
        headers: {
        //"Cache-control": "no-cache"
        },
        transformResponse: null,
      })
        .then(function(response) {
          var jsonStr = response.data; 
          //console.log(jsonStr)
          return jsonStr;

        }, function(response) {
          // something went wrong
          return $q.reject(response.data);
        });
    },
    

  };
 


}]);


// Controllers
// --------------------------------------------------------------------------

apiConsole.controller('ApiConsoleCtrl', ['$scope', 'AccountService', 'DownloadService', 'usSpinnerService', function($scope, AccountService, DownloadService, usSpinnerService) {

  $scope.tab = ['api', 'edit'][0];
  $scope.view = ['list', 'console'][1];
  $scope.swaggerUrl = null;
  $scope.swaggerEditorUrl = null;
  $scope.swaggerContent = null;
  $scope.canWriteSwagger = false;
  $scope.saveFailed = false;
  $scope.saveInProgress = false;
  
  var githubApi = null;
  var repoApi = null;
  var swaggerGithubData = null;

  /* 
  parses out github 'owner', 'repo', 'branch' and 'path' from a given github download_url
  return an object of this form:
   {owner: "...", repo: "...", branch: "...", path: "..."};
  */
  parseGithubInfoFromDownloadUrl = function(url) {
    
    //swagger file is not from github
    var startHostIndex = url.indexOf("raw.githubusercontent.com");
    if (startHostIndex == -1) {
      throw "Not a github download_url";
    }
    var response = {owner: null, repo: null, branch: null, path: null};
    var startRelativeIndex = url.indexOf("/", startHostIndex) + 1 
    urlRelative = url.substring(startRelativeIndex);
    var pieces = urlRelative.split("/")    
    response.owner = pieces.shift();
    response.repo = pieces.shift();
    response.branch = pieces.shift();
    response.path = pieces.join("/");
    return response;
  }

  //precondition: $scope.swaggerUrl is set
  init = function() {
  
    //get account info
    AccountService.getAccountFromSession().then(function(result) {

      $scope.account = result;
      
      //determine which github repo (if any) the swagger file is from
      try{
        swaggerGithubData = parseGithubInfoFromDownloadUrl($scope.swaggerUrl);
      } catch (e) {
        console.log("swagger file not from github")
        swaggerGithubData = {};
      }

      //configure github api with the authenticated user's access token
      githubApi = new Github({
         token: $scope.account.token,
         auth: "oauth"
      });

      repoApi = githubApi.getRepo(swaggerGithubData.owner, swaggerGithubData.repo);
       
      //check if user has write access to the github repo that hosts the swagger file
      repoApi.contributors(function(err, data) {

        for (var i = 0; i < data.length; i++) {
          var contributor = data[i];
          if (contributor.author.id == $scope.account.id) {
            $scope.$apply(function(){
              $scope.canWriteSwagger = true;
            });
            break;
          }
        }

        if (!$scope.canWriteSwagger) {
          console.log("user doesn't have 'write' access to swagger file")
        }
      });

      //download the swagger file
      DownloadService.getUrl($scope.swaggerUrl).then(function(data) {
        $scope.swaggerContent = data;
      })

    });
   
  }

  $scope.setSwaggerUrl = function(url) {
    $scope.swaggerUrl = url;
    init();
  }

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

  $scope.isSaveEnabled = function() {
    if ($scope.tab != 'edit' || !$scope.canWriteSwagger) {
      return false;
    }

    $scope.initEditor();
    return true;
  }
  
  $scope.injectEditor = function(obj) {
    var editorIframe = document.getElementById("swagger-editor-iframe");
    var contentWindow = editorIframe.contentWindow;
    var injector = contentWindow.angular.element(editorIframe.contentDocument.body).injector();
    injector.invoke(obj);
  }

  $scope.initEditor = function() {
    var isInitialized = false; //$scope.swaggerContent != null;

    if (isInitialized) {
      return;
    }

    $scope.injectEditor(["$rootScope",function($rootScope){
      //console.log("$rootScope:"+$rootScope);
      $rootScope.editorValue = $scope.swaggerContent;
    }]);
  }

  $scope.setSwaggerContentFromEditor = function() {
    $scope.injectEditor(["$rootScope",function($rootScope){      
      $scope.swaggerContent = $rootScope.editorValue;
    }]);
  }

  $scope.saveBegin = function(){
    $scope.saveInProgress = true;
    usSpinnerService.spin('spinner-save');
  }

  $scope.saveEnd = function(){
    $scope.saveInProgress = false;
    console.log($scope.saveInProgress);
    usSpinnerService.stop('spinner-save')
  }

  $scope.saveEditorContentsToGithub = function() {
    $scope.saveBegin();
    console.log("saving swagger to github");
    $scope.setSwaggerContentFromEditor();

    var options = {
      //author: {name: 'Author Name', email: 'author@example.com'},
      //committer: {name: 'Committer Name', email: 'committer@example.com'},
      encode: true // Whether to base64 encode the file. (default: true)
    }

    var commitMsg = "saved from apim"

    //repoApi.show(function(err, repo) {console.log(repo)});

    
    //this doesn't work. causes a PUT 404 error, which I believe is because the 'bcgov' organization hasn't yet granted
    //this application ('apim-app') access to write.  I have requested access and am awaiting a response.
    repoApi.write(swaggerGithubData.branch, 
      swaggerGithubData.path, 
      $scope.swaggerContent, 
      commitMsg, 
      options, 
      function(err) {
        $scope.$apply(function(){
          $scope.saveEnd();
          $scope.saveFailed = (err != null);
        });
      }
    );
    
    /*
    //this works.  
    repoApiTest = githubApi.getRepo("banders", "banders");
    repoApiTest.write('master', 'test.json', $scope.swaggerContent, 'test', options, function(err) {if (err != null) {alert("error saving: "+JSON.stringify(err));}});
    */
  }




}])

})();