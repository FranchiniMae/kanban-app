angular
  .module('kanbanApp', [
    'ui.router', 'satellizer'])
  .controller('MainController', MainController)
  .controller('HomeController', HomeController)
  .controller('LoginController', LoginController)
  .controller('SignupController', SignupController)
  .controller('LogoutController', LogoutController)
  .controller('ProfileController', ProfileController)
  .controller('GoalsController', GoalsController)
  .service('Account', Account)
  .config(configRoutes)
  .factory('goalService', [function () {
    var goalService = {};
    goalService.query = function() {
      // return al goals
    };

    goalService.get = function(id) {
      var goalId = parseInt(id);
      return Goals.find(function(goal) {
        return goal.id == id;
      });
    };
  }]);

////////////
// ROUTES //
////////////

configRoutes.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"]; // minification protection
function configRoutes($stateProvider, $urlRouterProvider, $locationProvider) {

  //this allows us to use routes without hash params!
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  // for any unmatched URL redirect to /
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'HomeController',
      controllerAs: 'home'
    })
    .state('goals', {
      url: '/goals/:id',
      templateUrl: 'templates/goals.html',
      controller: 'GoalsController',
      controllerAs: 'goals',

    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: 'SignupController',
      controllerAs: 'sc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginController',
      controllerAs: 'lc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('logout', {
      url: '/logout',
      template: null,
      controller: 'LogoutController',
      resolve: {
        loginRequired: loginRequired
      }
    })
    .state('profile', {
      url: '/profile',
      templateUrl: 'templates/profile.html',
      controller: 'ProfileController',
      controllerAs: 'profile',
      resolve: {
        loginRequired: loginRequired
      }
    });


    function skipIfLoggedIn($q, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    function loginRequired($q, $location, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.resolve();
      } else {
        $location.path('/login');
      }
      return deferred.promise;
    }

}

/////////////////
// CONTROLLERS //
/////////////////

MainController.$inject = ["Account"]; // minification protection
function MainController (Account) {
  var vm = this;

  vm.currentUser = function() {
   return Account.currentUser();
  };

}

GoalsController.$inject = ["$http", "$stateParams", "$scope", "$location"];
function GoalsController ($http, $stateParams, $scope, $location) {
  var vm = this;
  var goalId = ($location.path().split("/")[2]);

  $http.get('/api/goals/' + goalId)
    .then(function (response) {
      vm.tasks = [];
      vm.new_task = {};

      $scope.goal = response.data;
      vm.tasks = $scope.goal.tasks;

      vm.addTask = function() {
        $http.post('/api/goals/' + goalId + '/tasks', vm.new_task)
          .then(function (response) {
            vm.tasks.push(response.data.tasks[(response.data.tasks.length) - 1]);
            // console.log(response.data.tasks[(response.data.tasks.length) - 1]);
            vm.new_task = {};
          });
      };

      vm.updateTask = function(task) {
        var updatedTask = task;
        var taskId = task._id;
        $http.put('/api/goals/' + goalId + '/tasks/' + taskId, updatedTask)
          .then(function (response) {
            console.log("updating after ajax");
          });
      }; 

      vm.deleteTask = function(task) {
        var taskId = task._id;
        $http.delete('/api/goals/' + goalId + '/tasks/' + taskId)
          .then(function (response) {
            var taskindex = vm.tasks.indexOf(task);
            vm.tasks.splice(taskindex, 1);
          });
      };

      // start checkbox information
      vm.markComplete = function(task) {
        var updatedTask = task;
        var taskId = task._id;
        $http.put('/api/goals/' + goalId + '/tasks/' + taskId, updatedTask)
          .then(function (response) {
            console.log("updating after ajax");
          });
      };
      // end checkbox information


    });
}

HomeController.$inject = ["$http", "Account"]; // minification protection
function HomeController ($http, Account) {
  var vm = this;
  vm.goals = [];
  vm.new_goal = {}; // form data
  // vm.currentUser
  vm.currentUser = null;

  $http.get('/api/me/goals')
    .then(function (response) {
      vm.goals = response.data;
    });

  // $http.get('/api/goals')
  //   .then(function (response) {
  //     vm.goals = response.data;
  //   });

  vm.createGoal = function() {
    $http.post('/api/goals', vm.new_goal)
      .then(function (response){
        vm.goals.push(response.data);
        console.log(response.data);
        vm.new_goal = {};
      });
  };

  vm.updateGoal = function(goal) {
    console.log('updateGoal frontend', goal);
    var updatedGoal = goal;
    $http.put('/api/goals/' + goal._id, updatedGoal)
      .then(function(response) {
        console.log("hitting this update frontend");
      });
  };

  vm.deleteGoal = function(goal) {
    console.log('goal from delete', goal);
    $http.delete('/api/goals/' + goal._id)
      .then(function (response) {
        var index = vm.goals.indexOf(goal);
        vm.goals.splice(index, 1);
      });
  };
}

LoginController.$inject = ["$location", "Account"]; // minification protection
function LoginController ($location, Account) {
  var vm = this;
  vm.new_user = {}; // form data

  vm.login = function() {
    Account
      .login(vm.new_user)
      .then(function(){
        // TODO #4: clear sign up form
        vm.new_user = {};      
        // TODO #5: redirect to '/profile'
        $location.path( '/profile' );
      });
  };
}

SignupController.$inject = ["$location", "Account"]; // minification protection
function SignupController ($location, Account) {
  var vm = this;
  vm.new_user = {}; // form data

  vm.signup = function() {
    Account
      .signup(vm.new_user)
      .then(function (response) {
          // TODO #9: clear sign up form
          vm.new_user = {};
          // TODO #10: redirect to '/profile'
          $location.path( '/profile' );
        }
      );
  };
}

LogoutController.$inject = ["$location", "Account"]; // minification protection
function LogoutController ($location, Account) {
  Account.logout();
  $location.path('/login');
  // TODO #7: when the logout succeeds, redirect to the login page
}


ProfileController.$inject = ["$http", "Account"]; // minification protection
function ProfileController ($http, Account) {
  var vm = this;
  vm.new_profile = {}; // form data

  vm.updateProfile = function() {
    // TODO #14: Submit the form using the relevant `Account` method
    Account
      .updateProfile(vm.new_profile)
      .then(function () {
          // TODO #9: clear sign up form
          vm.showEditForm = false;
          // TODO #10: redirect to '/profile'
        }
      );
  };
    // On success, clear the form
}

//////////////
// Services //
//////////////

Account.$inject = ["$http", "$q", "$auth"]; // minification protection
function Account($http, $q, $auth) {
  var self = this;
  self.user = null;

  self.signup = signup;
  self.login = login;
  self.logout = logout;
  self.currentUser = currentUser;
  self.getProfile = getProfile;
  self.updateProfile = updateProfile;

  function signup(userData) {
    return ($auth.signup(userData)
      .then(function(response) {
        $auth.setToken(response.data.token);
      })
      .catch(function(error) {
        console.error(error);
        }
      )
    );
    // TODO #8: signup (https://github.com/sahat/satellizer#authsignupuser-options)
    // then, set the token (https://github.com/sahat/satellizer#authsettokentoken)
    // returns a promise
  }

  function login(userData) {
    return (
      $auth
        .login(userData) // login (https://github.com/sahat/satellizer#authloginuser-options)
        .then(
          function onSuccess(response) {
            $auth.setToken(response.data.token);
            //TODO #3: set token (https://github.com/sahat/satellizer#authsettokentoken)
          },

          function onError(error) {
            console.error(error);
          }
        )
    );
  }

  function logout() {
    $auth
      .logout()
      .then(function () {
      self.user = null;
    });

    // returns a promise!!!
    // TODO #6: logout the user by removing their jwt token (using satellizer)
    // Make sure to also wipe the user's data from the application:
    // self.user = null;
    // returns a promise!!!
  }

  function currentUser() {
    if ( self.user ) { return self.user; }
    if ( !$auth.isAuthenticated() ) { return null; }

    var deferred = $q.defer();
    getProfile().then(
      function onSuccess(response) {
        self.user = response.data;
        console.log(self.user);
        deferred.resolve(self.user);
      },

      function onError() {
        $auth.logout();
        self.user = null;
        deferred.reject();
      }
    );
    self.user = promise = deferred.promise;
    return promise;

  }

  function getProfile() {
    return $http.get('/api/me');
  }

  function updateProfile(profileData) {
    return (
      $http
        .put('/api/me', profileData)
        .then(
          function (response) {
            self.user = response.data;
          }
        )
    );
  }


}
