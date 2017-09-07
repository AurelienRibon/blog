'use strict';

require('bootstrap/dist/js/bootstrap.js');
const highlightjs = hljs; // eslint-disable-line no-undef
const marked      = require('marked');
const angular     = require('angular');
require('angular-route');

const app = angular.module('blog', [ 'ngRoute' ]);

marked.setOptions({
  breaks    : true,
  highlight : code => highlightjs.highlightAuto(code).value
});

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

app.controller('HomeController', function($scope, fetchMetas, setupDisqusCommentCounts) {
  $scope.rows = [];

  fetchMetas((err, posts) => {
    if (err) {
      return console.error('Cannot fetch posts', err);
    }

    $scope.posts = slicePostMetas(posts);
    setupDisqusCommentCounts();
  });
});

app.controller('PostController', function($scope, $location, $sce, fetchPost, setupDisqusComments) {
  const postId = getPostId();

  $scope.onClick = (event) => {
    if (event.altKey && event.shiftKey) {
      $location.path(`/editpost/${postId}`);
    }
  };

  fetchPost(postId, (err, post) => {
    if (err) {
      console.error('Cannot fetch post', err);
      return $location.path(`/`);
    }

    $scope.title    = post.title;
    $scope.date     = new Date(post.date);
    $scope.content  = $sce.trustAsHtml(marked(post.content));
    $scope.next     = post.next;
    $scope.previous = post.previous;
    $scope.loaded   = true;

    setupDisqusComments(postId);
  });
});

app.controller('EditPostController', function($scope, $sce, fetchPost, editPost) {
  const postId = getPostId();

  $scope.render = content => $sce.trustAsHtml(marked(content || ''));
  $scope.submit = () => {
    editPost(postId, $scope.password, $scope.content, err => {
      return window.alert(err ? `Failed to submit post. ${err.message}` : 'Post update successful!');
    });
  };

  fetchPost(postId, (err, post) => {
    if (err) {
      return console.error('Cannot fetch post', err);
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

app.factory('fetchMetas', function($http) {
  return (done) => {
    $http.get('/api/getpostmetas/0/120').then(res => {
      return done(null, res.data);
    }, res => {
      return done(new Error(`${res.data}`));
    });
  };
});

app.factory('fetchPost', function($http) {
  return (postId, done) => {
    $http.get(`/api/getpost/${postId}`).then(res => {
      return done(null, res.data);
    }, res => {
      return done(new Error(`${res.data}`));
    });
  };
});

app.factory('editPost', function($http) {
  return (postId, password, content, done) => {
    $http.post(`/api/editpost/${postId}`, { password, content }).then(() => {
      return done();
    }, res => {
      return done(new Error(`${res.data}`));
    });
  };
});

app.factory('setupDisqusCommentCounts', function($timeout) {
  return () => {
    $timeout(() => {
      const scriptAlreadyInserted = document.querySelector('#dsq-count-scr');

      if (!scriptAlreadyInserted) {
        const script = document.createElement('script');
        script.src = 'https://aurelienribon.disqus.com/count.js';
        script.id  = 'dsq-count-scr';

        document.head.appendChild(script);
      } else {
        DISQUSWIDGETS.getCount({ reset: true }); // eslint-disable-line no-undef
      }
    });
  };
});

app.factory('setupDisqusComments', function($timeout) {
  return (postId) => {
    const config = function() {
      this.page.url        = `https://aurelienribon.herokuapp.com/post/${postId}`;
      this.page.identifier = postId;
    };

    $timeout(() => {
      const scriptAlreadyInserted = document.querySelector('#disqus-embed-js');

      if (!scriptAlreadyInserted) {
        window.disqus_config = config;

        const script = document.createElement('script');
        script.src = 'https://aurelienribon.disqus.com/embed.js';
        script.id  = 'disqus-embed-js';
        script.setAttribute('data-timestamp', +new Date());

        document.head.appendChild(script);
      } else {
        DISQUS.reset({ reload: true, config }); // eslint-disable-line no-undef
      }
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
  const slicedPosts = { old: [ [] ], new: [ [] ] };

  for (const post of posts) {
    post.date = new Date(post.date);

    const year  = post.date.getFullYear();
    const rows  = year < 2017 ? slicedPosts.old : slicedPosts.new;
    let lastRow = rows[rows.length - 1];

    if (lastRow.length === 3) {
      lastRow = [];
      rows.push(lastRow);
    }

    lastRow.push(post);
  }

  return slicedPosts;
}

function getPostId() {
  const location = window.location.href;
  const idStart  = location.lastIndexOf('/');
  return location.slice(idStart + 1);
}
