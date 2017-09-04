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
  $scope.posts = [];

  $http.get('api/getpostmetas/0/120').then(res => {
    $scope.posts = res.data.reverse();
  }, res => {
    console.error('Cannot fetch metas', res);
  });
});

app.controller('PostController', ($scope, $http, $sce) => {
  const postId = getQueryParam('id');

  $http.get(`api/getpost/${postId}`).then(res => {

    $scope.title   = res.data.title;
    $scope.content = $sce.trustAsHtml(marked(res.data.content));
  }, res => {
    console.error('Cannot fetch post', res);
  });
});

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function getQueryParam(paramId) {
  const str = window.location.href;
  const startIndex = str.lastIndexOf('?');

  if (startIndex === -1) {
    return null;
  }

  const tuples = str.slice(startIndex + 1).split('&').map(it => it.split('='));
  const tuple  =  tuples.find(it => it[0] === paramId);
  return tuple && tuple[1];
}
