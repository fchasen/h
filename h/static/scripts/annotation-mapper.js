'use strict';

var angular = require('angular');

var events = require('./events');

// Fetch the container object for the passed annotation from the threading
// service, but only return it if it has an associated message.
function getContainer(threading, annotation) {
  var container = threading.idTable[annotation.id];
  if (container === null || typeof container === 'undefined') {
    return null;
  }
  // Also return null if the container has no message
  if (!container.message) {
    return null;
  }
  return container;
}


// Wraps the annotation store to trigger events for the CRUD actions
// @ngInject
function annotationMapper($rootScope, threading, store) {
  function loadAnnotations(annotations, replies) {
    annotations = annotations.concat(replies || []);

    var loaded = [];

    annotations.forEach(function (annotation) {
      var container = getContainer(threading, annotation);
      if (container !== null) {
        angular.copy(annotation, container.message);
        $rootScope.$emit(events.ANNOTATION_UPDATED, container.message);
        return;
      }

      loaded.push(new store.AnnotationResource(annotation));
    });

    $rootScope.$emit(events.ANNOTATIONS_LOADED, loaded);
  }

  function unloadAnnotations(annotations) {
    var unloaded = annotations.map(function (annotation) {
      var container = getContainer(threading, annotation);
      if (container !== null && annotation !== container.message) {
        annotation = angular.copy(annotation, container.message);
      }
      return annotation;
    });
    $rootScope.$emit(events.ANNOTATIONS_UNLOADED, unloaded);
  }

  function createAnnotation(annotation) {
    annotation = new store.AnnotationResource(annotation);
    $rootScope.$emit(events.BEFORE_ANNOTATION_CREATED, annotation);
    return annotation;
  }

  function deleteAnnotation(annotation) {
    return annotation.$delete({
      id: annotation.id
    }).then(function () {
      $rootScope.$emit(events.ANNOTATION_DELETED, annotation);
      return annotation;
    });
  }

  return {
    loadAnnotations: loadAnnotations,
    unloadAnnotations: unloadAnnotations,
    createAnnotation: createAnnotation,
    deleteAnnotation: deleteAnnotation
  };
}


module.exports = annotationMapper;
