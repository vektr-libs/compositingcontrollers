function createSVGInstantiator(lib,controllerslib,compositinglib,mylib){
  'use strict';

  var HORIZONTAL = /.*\-horizontal\.svg/,
    VERTICAL = /.*\-vertical\.svg/, 
    Layer = compositinglib.Layer;

  function SVGInstantiator (svgurl, controller, path) {
    controllerslib.Controller.call(this, controller, path);
    this.svgurl = svgurl;
    this.layers = new lib.Map();
    this._scene_destroy_l = null;
  }
  lib.inherit(SVGInstantiator, controllerslib.Controller);
  SVGInstantiator.prototype.__cleanUp = function () {
    if (this._scene_destroy_l) {
      this._scene_destroy_l.destroy();
    }
    this._scene_destroy_l = null;
    this.svgurl = null;
    this.layers.traverse(lib.doMethod.bind(null, 'destroy', null));
    this.layers.destroy();
    this.layers = null;
    controllerslib.Controller.prototype.__cleanUp.call(this);
  };

  SVGInstantiator.prototype.runOn = function (elid) {
    var newscene;
    if (!this.LayerList) throw new Error('Unable to run on '+elid+' LayerList missing ...');
    newscene = this.newScene(elid);
    this.LayerList.forEach(this._runOn.bind(this, newscene));
    this.onLayersReady(compositinglib.Theater.scene(elid));
  };
  SVGInstantiator.prototype.onLayersReady = lib.dummyFunc;

  SVGInstantiator.prototype.newScene = function (elid) {
    var ret = compositinglib.Theater.scene(elid);
    if (this._scene_destroy_l) {
      this._scene_destroy_l.destroy();
    }
    this._scene_destroy_l = null;
    if (!(ret && ret.destroyed)) {
      return;
    }
    this._scene_destroy_l = ret.destroyed.attach(this.destroy.bind(this));
    return ret;
  };

  SVGInstantiator.prototype._runOn = function (scene, item, index) {
    if (!item.path && !(item.path instanceof Array)) throw new Error('Missing path...');
    if (!item.ctor && !(item.ctor.prototype instanceof controllerslib.Standalone)) throw new Error('Invalid ctor');
    var oindex = index, ident = item.path.join('/'), layer;

    var orientation = null;
    if (scene.get('mindOrientation')) {
      if (this.get('svgurl').match(HORIZONTAL)) orientation = Layer.HORIZONTAL;
      if (this.get('svgurl').match(VERTICAL)) orientation = Layer.VERTICAL;
    }

    if (orientation) {
      oindex = 2*index + ((orientation === 'horizontal') ? 0 : 1);
    }

    if (!this.layers.get(ident)) {
      this.layers.add(ident, new item.ctor(this, item.path, scene, oindex));
    }
  };
  mylib.SVGInstantiator = SVGInstantiator;

}

module.exports = createSVGInstantiator;
