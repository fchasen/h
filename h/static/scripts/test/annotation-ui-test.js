'use strict';

var annotationUIFactory = require('../annotation-ui');

describe('annotationUI', function () {
  var annotationUI;

  beforeEach(function () {
    annotationUI = annotationUIFactory({});
  });

  describe('initialization', function () {
    it('does not set a selection when settings.annotations is null', function () {
      assert.isFalse(annotationUI.hasSelectedAnnotations());
    });

    it('sets the selection when settings.annotations is set', function () {
      annotationUI = annotationUIFactory({annotations: 'testid'});
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, {
        testid: true,
      });
    });
  });

  describe('.focusAnnotations()', function () {
    it('adds the passed annotations to the focusedAnnotationMap', function () {
      annotationUI.focusAnnotations([{ $$tag: 1 }, { $$tag: 2 }, { $$tag: 3 }]);
      assert.deepEqual(annotationUI.getState().focusedAnnotationMap, {
        1: true, 2: true, 3: true
      });
    });

    it('replaces any annotations originally in the map', function () {
      annotationUI.getState().focusedAnnotationMap = { 1: true };
      annotationUI.focusAnnotations([{ $$tag: 2 }, { $$tag: 3 }]);
      assert.deepEqual(annotationUI.getState().focusedAnnotationMap, {
        2: true, 3: true
      });
    });

    it('does not modify the original map object', function () {
      var orig = annotationUI.getState().focusedAnnotationMap = { 1: true };
      annotationUI.focusAnnotations([{ $$tag: 2 }, { $$tag: 3 }]);
      assert.notEqual(annotationUI.getState().focusedAnnotationMap, orig);
    });

    it('nulls the map if no annotations are focused', function () {
      annotationUI.getState().focusedAnnotationMap = { $$tag: true };
      annotationUI.focusAnnotations([]);
      assert.isNull(annotationUI.getState().focusedAnnotationMap);
    });
  });

  describe('.hasSelectedAnnotations', function () {
    it('returns true if there are any selected annotations', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      assert.isTrue(annotationUI.hasSelectedAnnotations());
    });

    it('returns false if there are no selected annotations', function () {
      annotationUI.getState().selectedAnnotationMap = null;
      assert.isFalse(annotationUI.hasSelectedAnnotations());
    });
  });

  describe('.isAnnotationSelected', function () {
    it('returns true if the id provided is selected', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      assert.isTrue(annotationUI.isAnnotationSelected(1));
    });

    it('returns false if the id provided is not selected', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      assert.isFalse(annotationUI.isAnnotationSelected(2));
    });

    it('returns false if there are no selected annotations', function () {
      annotationUI.getState().selectedAnnotationMap = null;
      assert.isFalse(annotationUI.isAnnotationSelected(1));
    });
  });

  describe('.selectAnnotations()', function () {
    it('adds the passed annotations to the selectedAnnotationMap', function () {
      annotationUI.selectAnnotations([{ id: 1 }, { id: 2 }, { id: 3 }]);
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, {
        1: true, 2: true, 3: true
      });
    });

    it('replaces any annotations originally in the map', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.selectAnnotations([{ id: 2 }, { id: 3 }]);
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, {
        2: true, 3: true
      });
    });

    it('does not modify the original map object', function () {
      var orig = annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.selectAnnotations([{ id: 2 }, { id: 3 }]);
      assert.notEqual(annotationUI.getState().selectedAnnotationMap, orig);
    });

    it('nulls the map if no annotations are selected', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.selectAnnotations([]);
      assert.isNull(annotationUI.getState().selectedAnnotationMap);
    });
  });

  describe('.xorSelectedAnnotations()', function () {
    it('adds annotations missing from the selectedAnnotationMap', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true, 2: true };
      annotationUI.xorSelectedAnnotations([{ id: 3 }, { id: 4 }]);
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, {
        1: true, 2: true, 3: true, 4: true
      });
    });

    it('removes annotations already in the selectedAnnotationMap', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true, 3: true };
      annotationUI.xorSelectedAnnotations([{ id: 1 }, { id: 2 }]);
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, { 2: true, 3: true });
    });

    it('does not modify the original map object', function () {
      var orig = annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.xorSelectedAnnotations([{ id: 2 }, { id: 3 }]);
      assert.notEqual(annotationUI.getState().selectedAnnotationMap, orig);
    });

    it('nulls the map if no annotations are selected', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.xorSelectedAnnotations([{ id: 1 }]);
      assert.isNull(annotationUI.getState().selectedAnnotationMap);
    });
  });

  describe('.removeSelectedAnnotation', function () {
    it('removes an annotation from the selectedAnnotationMap', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true, 2: true, 3: true };
      annotationUI.removeSelectedAnnotation({ id: 2 });
      assert.deepEqual(annotationUI.getState().selectedAnnotationMap, {
        1: true, 3: true
      });
    });

    it('does not modify the original map object', function () {
      var orig = annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.removeSelectedAnnotation({ id: 1 });
      assert.notEqual(annotationUI.getState().selectedAnnotationMap, orig);
    });

    it('nulls the map if no annotations are selected', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true };
      annotationUI.removeSelectedAnnotation({ id: 1 });
      assert.isNull(annotationUI.getState().selectedAnnotationMap);
    });
  });

  describe('.clearSelectedAnnotations', function () {
    it('removes all annotations from the selection', function () {
      annotationUI.getState().selectedAnnotationMap = { 1: true, 2: true, 3: true };
      annotationUI.clearSelectedAnnotations();
      assert.isNull(annotationUI.getState().selectedAnnotationMap);
    });
  });
});
