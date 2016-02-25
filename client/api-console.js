(function(){


var apiConsole = angular.module('ApiConsole', ['angularSpinner', 'Account', 'ngSanitize']);

// Services
// --------------------------------------------------------------------------

//stores data to be shared across all instances of ApiConsoleCtrl
apiConsole.factory('ConsoleService', ['$rootScope', function($rootScope){
  return {
    tab: ['api', 'edit'][0],
    swaggerEditable: false,
    swaggerContent: "",
    githubRepo: null,
    swaggerGithubData: null,
    saveInProgress: false,
    saveFailed: false,

    getTab: function() {
      return this.tab;
    },
    setTab: function(tab) {
      this.tab = tab;
      $rootScope.$emit('tab-changed', this.tab);
    },

    setSwaggerEditable(editable) {
      this.swaggerEditable = editable;
    },
    isSwaggerEditable() {
      return this.swaggerEditable;
    },

    setSwaggerContent(content) {
      var changed = (this.swaggerContent != content)
      this.swaggerContent = content;
      if (changed)
        $rootScope.$emit('swagger-content-changed');
    },
    getSwaggerContent() {
      return this.swaggerContent;
    },

    setGithubRepo(repo) {
      this.githubRepo = repo;
    },
    getGithubRepo() {
      return this.githubRepo;
    },

    setSwaggerGithubData(data) {
      this.swaggerGithubData = data;
    },
    getSwaggerGithubData() {
      return this.swaggerGithubData;
    }, 

    setSaveInProgress(status) {
      this.saveInProgress = status;
    },
    getSaveInProgress() {
      return this.saveInProgress;
    },

    setSaveFailed(status) {
      this.saveFailed = status;
    },
    getSaveFailed() {
      return this.saveFailed;
    },

    isSaveEnabled() {
      if (this.getTab() != 'edit' || !this.isSwaggerEditable()) {
        return false;
      }

      return true;
    },

    triggerSave() {
      this.setSaveInProgress(true);
      $rootScope.$emit('save-triggered');
    }



  };
 
}]);

apiConsole.factory('DownloadService', ['$http', '$q', function($http, $q){
  return {

    //returns a promise
    getUrl: function(url) {
      
      var separator = "?";
      if (url.indexOf(separator) != -1) {
        separator = "&"
      }
      url += separator + "" +(new Date().getTime());
      //console.log(url);

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

apiConsole.controller('ApiConsoleCtrl', 
  ['$rootScope',
  '$scope', 
  '$location',
  '$timeout',
  'AccountService', 
  'DownloadService',
  'ConsoleService',
  'usSpinnerService', 
  'ApiService', 
  function($rootScope, $scope, $location, $timeout, AccountService, DownloadService, ConsoleService, usSpinnerService, ApiService) {

  $scope.view = ['list', 'console'][1];
  $scope.swaggerEditorUrl = null;
  $scope.swaggerContent = null;
  $scope.saveFailed = false;
  $scope.saveInProgress = false;
  
  var githubApi = null;

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

  $scope.getTab = function() {
    return ConsoleService.getTab();
  }

  $scope.setTab = function(tab) {
    ConsoleService.setTab(tab);
  }

  //precondition: ApiService.getSelectedSwaggerUrl() returns not null
  refresh = function() {

    //if a swagger url hasn't been selected, redirect user to the api list
    if (ApiService.getSelectedSwaggerUrl() == null) {
      $location.path('/list');
      console.log("swagger url not set.  redirecting");
      return;
    }
    console.log("refreshing console: "+ApiService.getSelectedSwaggerUrl())

    //get account info
    AccountService.getAccount().then(function(result) {

      $scope.account = result;
      console.log("got account");      
      //determine which github repo (if any) the swagger file is from
      try{
        var swaggerGithubData = parseGithubInfoFromDownloadUrl(ApiService.getSelectedSwaggerUrl());
        ConsoleService.setSwaggerGithubData(swaggerGithubData);
      } catch (e) {
        console.log("swagger file not from github");
        swaggerGithubData = null;
      }

      //check if the file is editable
      //(only when the user is logged in, and the file is hosted on github)
      if ($scope.account.username && swaggerGithubData) {

        //configure github api with the authenticated user's access token
        githubApi = new Github({
           token: $scope.account.token,
           auth: "oauth"
        });
        
        ConsoleService.setGithubRepo(githubApi.getRepo(swaggerGithubData.owner, swaggerGithubData.repo));
         
        //check if user has write access to the github repo that hosts the swagger file
        ConsoleService.getGithubRepo().contributors(function(err, data) {


          for (var i = 0; i < data.length; i++) {
            var contributor = data[i];
            //console.log(JSON.stringify(contributor.author));
            if (contributor.author.id == $scope.account.id) {
              ConsoleService.setSwaggerEditable(true);
            }
          }

          if (!ConsoleService.getSwaggerEditable()) {
            console.log("user doesn't have 'write' access to swagger file (a)")
          }
        });

      }
      else {
        console.log("user doesn't have 'write' access to swagger file (b)")
      }

      //download the swagger file, and reset the editor
      DownloadService.getUrl(ApiService.getSelectedSwaggerUrl()).then(function(data) {
        ConsoleService.setSwaggerContent(data);
        $scope.initEditor();
      })

      //reset the swagger-ui
      document.getElementById('swagger-ui-iframe').src = "swagger-ui.html?swaggerUrl="+ApiService.getSelectedSwaggerUrl()+"?"+(new Date().getTime());

    });
   
  }
 
  $scope.injectEditor = function(obj) {
    var editorIframe = document.getElementById("swagger-editor-iframe");
    var contentWindow = editorIframe.contentWindow;
    if (!contentWindow.angular) {
      $timeout(function() {
        $scope.injectEditor(obj);
      }, 500);
      return;
    }

    var injector = contentWindow.angular.element(editorIframe.contentDocument.body).injector();
    if (!injector) {
      $timeout(function() {
        $scope.injectEditor(obj);
      }, 500);
      return;
    }

    var injector = contentWindow.angular.element(editorIframe.contentDocument.body).injector();
    injector.invoke(obj);    
  }

  $scope.initEditor = function() {
    var isInitialized = false; //$scope.swaggerContent != null;

    if (isInitialized) {
      return;
    }

    $scope.injectEditor(["$rootScope",function($rootScope){
      $rootScope.editorValue = ConsoleService.getSwaggerContent();
    }]);
  }

  $scope.setSwaggerContentFromEditor = function() {
    $scope.injectEditor(["$rootScope",function($rootScope){      
      ConsoleService.setSwaggerContent($rootScope.editorValue);
    }]);
  }

  $scope.saveEditorContentsToGithub = function() {
    $scope.setSwaggerContentFromEditor();
    var swaggerGithubData = ConsoleService.getSwaggerGithubData()
    var options = {
      //author: {name: 'Author Name', email: 'author@example.com'},
      //committer: {name: 'Committer Name', email: 'committer@example.com'},
      encode: true // Whether to base64 encode the file. (default: true)
    }

    var commitMsg = "saved from apim"

    //repoApi.show(function(err, repo) {console.log(repo)});

    //note: this call causes an HTTP 404 error if the user doesn't have permission to write to the repo OR
    //if the application doesn't have access to write to the repo
    ConsoleService.getGithubRepo().write(swaggerGithubData.branch, 
      swaggerGithubData.path, 
      ConsoleService.getSwaggerContent(), 
      commitMsg, 
      options, 
      function(err) {
        $scope.$apply(function(){         
          
          ConsoleService.setSaveFailed(err != null);
          ConsoleService.setSaveInProgress(false);

          if (!err) {
            refresh();
          }

        });
      }
    );
    
    /*
    //this works.  
    repoApiTest = githubApi.getRepo("banders", "banders");
    repoApiTest.write('master', 'test.json', $scope.swaggerContent, 'test', options, function(err) {if (err != null) {alert("error saving: "+JSON.stringify(err));}});
    */
  }

  $rootScope.$on('save-triggered', function() {
    $scope.saveEditorContentsToGithub();
  }); 

  refresh();

}])

apiConsole.controller('ConsoleMenuCtrl', 
  ['$scope', 'ConsoleService',
    function($scope, ConsoleService) {

  $scope.getTab = function() {
    return ConsoleService.getTab();
  }

  $scope.setTab = function(tab) {
    ConsoleService.setTab(tab);
  }
      
  $scope.isSaveEnabled = function() {
    return ConsoleService.isSaveEnabled();
  }   

  $scope.triggerSave = function() {
    ConsoleService.triggerSave();
  }

  $scope.getSaveInProgress = function() {
    return ConsoleService.getSaveInProgress();
  }

  $scope.getSaveFailed = function() {
    return ConsoleService.getSaveFailed();
  }

}])

})();