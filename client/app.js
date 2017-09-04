'use strict';

require('bootstrap/dist/js/bootstrap.js');

const angular = require('angular');
const marked  = require('marked');
const app     = angular.module('blog', []);

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

// -----------------------------------------------------------------------------
// CONTROLLERS
// -----------------------------------------------------------------------------

app.controller('MainController', ($scope, $http) => {
  $scope.rows = [];

  $http.get('/api/getpostmetas/0/120').then(res => {
    const posts = res.data.reverse();
    $scope.rows = slicePostMetas(posts);
  }, res => {
    console.error('Cannot fetch metas', res);
  });
});

app.controller('PostController', ($scope, $http, $sce) => {
  const postId = getPostId();
  setupDisqus(postId);

  $http.get(`/api/getpost/${postId}`).then(res => {
    const content   = res.data.content;
    $scope.title    = res.data.title;
    $scope.date     = new Date(res.data.date);
    $scope.content  = $sce.trustAsHtml(marked(content));
    $scope.next     = res.data.next;
    $scope.previous = res.data.previous;
    $scope.loaded   = true;
  }, res => {
    console.error('Cannot fetch post', res);
  });
});

app.directive('visibleIf', () => ({
  restrict : 'A',
  scope    : { condition: '=visibleIf' },
  link(scope, element, attrs) { console.log('attrs', attrs);
    scope.$watch('condition', val => {
      if (val === true) {
        element.css('visibility', 'visible');
      }
    });
  }
}));

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
