'use strict';

require('bootstrap/dist/js/bootstrap.js');

const angular = require('angular');
require('angular-route');

const marked = require('marked');
const app = angular.module('blog', [ 'ngRoute' ]);

marked.setOptions({ breaks: true });

// -----------------------------------------------------------------------------
// ROUTER
// -----------------------------------------------------------------------------

app.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
    .when('/', {
      templateUrl : 'part-home.html',
      controller  : 'HomeController'
    })
    .when('/post/:postId', {
      templateUrl : 'part-post.html',
      controller  : 'PostController'
    })
    .when('/editpost/:postId', {
      templateUrl : 'part-editpost.html',
      controller  : 'EditPostController'
    })
    .otherwise({
      redirectTo  : '/'
    });
});

// -----------------------------------------------------------------------------
// CONTROLLERS
// -----------------------------------------------------------------------------

app.controller('HomeController', function($scope, $http) {
  $scope.rows = [];

  $http.get('/api/getpostmetas/0/120').then(res => {
    const posts = res.data.reverse();
    $scope.rows = slicePostMetas(posts);
  }, res => {
    console.error('Cannot fetch metas', res);
  });
});

app.controller('PostController', function($scope, $location, $sce, fetchPost) {
  const postId = getPostId();
  setupDisqus(postId);

  $scope.onClick = (event) => {
    console.dir(event, { depth: 100, colors: true });
    if (event.altKey && event.shiftKey) {
      $location.path(`/editpost/${postId}`);
    }
  };

  fetchPost(postId, (err, post) => {
    if (err) {
      return console.error('Cannot fetch post', err);
    }

    $scope.title    = post.title;
    $scope.date     = new Date(post.date);
    $scope.content  = $sce.trustAsHtml(marked(post.content));
    $scope.next     = post.next;
    $scope.previous = post.previous;
    $scope.loaded   = true;
  });
});

app.controller('EditPostController', function($scope, $sce, fetchPost, editPost) {
  const postId = getPostId();

  $scope.render = content => $sce.trustAsHtml(marked(content || ''));
  $scope.submit = () => {
    editPost(postId, $scope.content, err => {
      return window.alert(err ? `Failed to submit post: ${JSON.stringify(err)}` : 'Post update successful!');
    });
  };

  fetchPost(postId, (err, post) => {
    if (err) {
      return window.alert('Cannot fetch post', err);
    }

    $scope.title   = post.title;
    $scope.date    = new Date(post.date);
    $scope.content = post.content;
    $scope.loaded  = true;
  });
});

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

app.factory('fetchPost', function($http) {
  return (postId, done) => {
    $http.get(`/api/getpost/${postId}`).then(res => {
      return done(null, res.data);
    }, err => {
      return done(err);
    });
  };
});

app.factory('editPost', function($http) {
  return (postId, content, done) => {
    $http.post(`/api/editpost/${postId}`, { content }).then(() => {
      return done();
    }, err => {
      return done(err);
    });
  };
});

// -----------------------------------------------------------------------------
// DIRECTIVES
// -----------------------------------------------------------------------------

app.directive('visibleIf', function() {
  return {
    restrict : 'A',
    scope    : { condition: '=visibleIf' },

    link(scope, element) {
      scope.$watch('condition', val => {
        if (val === true) {
          element.css('visibility', 'visible');
        }
      });
    }
  };
});

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function slicePostMetas(posts) {
  const rows = [];
  let row;

  for (let i = 0; i < posts.length; ++i) {
    if (i % 3 === 0) {
      row = [];
      rows.push(row);
    }

    row.push(posts[i]);
  }

  return rows;
}

function getPostId() {
  const location = window.location.href;
  const idStart  = location.lastIndexOf('/');
  return location.slice(idStart + 1);
}

function setupDisqus(postId) {
  window.disqus_config = function() {
    this.page.url        = `https://aurelienribon.herokuapp.com/post/${postId}`;
    this.page.identifier = postId;
  };

  const script = document.createElement('script');
  script.src = 'https://aurelienribon.disqus.com/embed.js';
  script.setAttribute('data-timestamp', +new Date());

  const target = document.head || document.body;
  target.appendChild(script);
}
