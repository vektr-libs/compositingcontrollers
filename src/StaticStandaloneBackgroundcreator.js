function createStaticStandaloneBackground(lib, controllerslib, mylib) {
  'use strict';

  var SVGInstantiator = mylib.SVGInstantiator,
    Standalone = controllerslib.Standalone;

  function StaticStandaloneBackground (svgurl, controller, path) {
    SVGInstantiator.call(this, svgurl, controller, path);
  }
  lib.inherit (StaticStandaloneBackground, SVGInstantiator);
  StaticStandaloneBackground.prototype.__cleanUp = function () {
    SVGInstantiator.prototype.__cleanUp.call(this);
  };

  StaticStandaloneBackground.prototype.onLayersReady = function () {
    this.layers.get('background').show();
  };

  StaticStandaloneBackground.prototype.LayerList = [
    {
      path:['background'],
      ctor: Standalone
    }
  ];

  mylib.StaticStandaloneBackground = StaticStandaloneBackground;
}

module.exports = createStaticStandaloneBackground;
