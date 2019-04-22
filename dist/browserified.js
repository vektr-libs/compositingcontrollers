(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var lr = ALLEX.execSuite.libRegistry;
lr.register('vektr_compositingcontrollerslib',
  require('./index')(
    ALLEX,
    lr.get('allex_hierarchymixinslib'),
    lr.get('vektr_controllerslib'),
    lr.get('vektr_compositinglib'),
    lr.get('vektr_commonlib'),
    lr.get('vektr_windowmonitoringlib')
  )
);

},{"./index":2}],2:[function(require,module,exports){
function createLib (execlib, hierarchymixinslib, controllerslib, compositinglib, commonlib, windowmonitoringlib) {
  'use strict';

  var lib = execlib.lib;
  var ret = {
    util: {}
  };

  require('./src/utilcreator')(lib,ret);
  require('./src/SVGInstantiatorcreator')(lib,controllerslib,compositinglib,ret);
  require('./src/StaticStandaloneBackgroundcreator')(lib,controllerslib,ret);
  require('./src/Layercreator')(lib,hierarchymixinslib,controllerslib,commonlib,compositinglib,windowmonitoringlib,ret);
  require('./src/Scenecreator')(lib,hierarchymixinslib,compositinglib,ret);

  return ret;
}

module.exports = createLib;

},{"./src/Layercreator":3,"./src/SVGInstantiatorcreator":4,"./src/Scenecreator":5,"./src/StaticStandaloneBackgroundcreator":6,"./src/utilcreator":7}],3:[function(require,module,exports){
function createLayer(lib,hierarchymixinslib,controllerslib,commonlib,compositinglib,windowmonitoringlib,mylib){
  'use strict';

  function LayerMouseEnvironment(layer){
    controllerslib.ChildMouseEnvironment.call(this,layer);
  }
  lib.inherit(LayerMouseEnvironment,controllerslib.ChildMouseEnvironment);
  LayerMouseEnvironment.prototype.translate = function(evntname,evnt,silent){
    var ret = controllerslib.ChildMouseEnvironment.prototype[evntname].call(this,evnt);
    if(!silent){
      if(!ret){
        this.canvas.distributeMouse(evntname,evnt);
      }
    }
  };
  LayerMouseEnvironment.prototype.moved = function(evnt,silent){
    this.translate('moved',evnt,silent);
  };
  LayerMouseEnvironment.prototype.down = function(evnt,silent){
    this.translate('down',evnt,silent);
  };
  LayerMouseEnvironment.prototype.up = function(evnt,silent){
    this.translate('up',evnt,silent);
  };
  LayerMouseEnvironment.prototype.touched = function(evnt,silent){
    this.translate('touched',evnt,silent);
  };
  LayerMouseEnvironment.prototype.touchmoved = function(evnt,silent){
    this.translate('touchmoved',evnt,silent);
  };
  LayerMouseEnvironment.prototype.untouched = function(evnt,silent){
    this.translate('untouched',evnt,silent);
  };

  function Layer(vektrinstance, orientation){
    lib.Destroyable.call(this);
    compositinglib.RenderingParent.call(this);
    hierarchymixinslib.Child.call(this,vektrinstance);
    this.preventMousePropagation = false;
    this.user_display = true;
    this.orientation = orientation || null;
    this.valid_orientation = null;
    this.allowedToChangeParentsDims = calculateAllowedToChangeParentDims(orientation, vektrinstance.container);
    this.el = document.createElement('canvas');
    this.el.style.position = 'absolute';
    addTo (vektrinstance.container, this.el);
    this.el.style.setProperty('-webkit-tap-highlight-color','transparent');
    commonlib.enable3DAcceleration(this.el);
    this.ctx = this.el.getContext('2d');
    this.sizeListener = windowmonitoringlib.onResize.attach(this.checkSize.bind(this));
    this.width = 0;
    this.height = 0;
    this.sizeFit = false;
    this.environments = {
      mouse: new LayerMouseEnvironment(this)
    };
    this.checkSize();
    lib.runNext(this.checkSize.bind(this),1000);
  }
  lib.inherit(Layer,compositinglib.RenderingParent);
  Layer.prototype.__cleanUp = function(){
    lib.traverse(this.environments,commonlib.destroyDestroyable);
    this.user_display = null;
    this.preventMousePropagation = null;
    this.orientation = null;
    this.valid_orientation = null;
    this.environments = null;
    this.sizeFit = null;
    this.height = null;
    this.width = null;
    this.sizeListener.destroy();
    this.sizeListener = null;
    this.ctx = null;
    this.el = null;
    this.allowedToChangeParentsDims = null;
    this.sizeListener = null;
    hierarchymixinslib.Child.prototype.__cleanUp.call(this);
    lib.Gettable.prototype.__cleanUp.call(this);
    compositinglib.RenderingParent.prototype.__cleanUp.call(this);
    lib.Destroyable.prototype.__cleanUp.call(this);
  };
  Layer.prototype.destroy = lib.Destroyable.prototype.destroy;
  Layer.prototype.getSizeReferentElement = function () {
    return (this.allowedToChangeParentsDims) ? this.el.parentElement.parentElement : this.el.parentElement;
  };
  Layer.prototype.checkSize = function(){
    if(!this.destroyed){return;}
    var p = this.getSizeReferentElement(), w=p.offsetWidth, h=p.offsetHeight,change=false;
    if(Math.floor(w)!== Math.floor(this.width)){
      this.width = w;
      change=true;
    }
    if(Math.floor(h)!==Math.floor(this.height)){
      this.height = h;
      change=true;
    }
    this.sizeFit = false;
    if(change){
      this.onSizeChanged();
    }
  };
  Layer.prototype.distributeMouse = function(evntname,evnt){
    if(!this.__parent){
      return;
    }
    if (this.preventMousePropagation && this.get('visible')) {
      return;
    }
    this.__parent.distributeMouse(this,evntname,evnt);
  };
  Layer.prototype.attachListener = lib.Listenable.prototype.attachListener;
  Layer.prototype._allowRender = function () {
    if (!this.user_display) return false;
    var show = false;

    //var refel = this.getSizeReferentElement();
    //var w = refel.offsetWidth, h = refel.offsetHeight; ///reconsider this comment ...
    var w = document.body.offsetWidth, h = document.body.offsetHeight;
    if (!isNaN(w) && !isNaN(h)) {
      if (this.orientation) {
        show = false;
        if (w > h) {
          show = this.get('orientation') === Layer.HORIZONTAL;
        }else{
          show = this.get('orientation') === Layer.VERTICAL;
        }
      }else{
        show = true;
      }
    }else{
      show = false;
    }
    this.set('valid_orientation', show);
    return show;
  };
  Layer.prototype.set_valid_orientation = function (val) {
    this.valid_orientation = val;
  };
  Layer.prototype.onSizeChanged = function(){
    var backingScale = window.devicePixelRatio || 1;
    var show = this._allowRender();
    if (!show) {
      this.fullhide();
    }else{
      this.fullshow();
    }

    this.el.width = this.width*backingScale;
    this.el.height = this.height*backingScale;
    this.el.style.width = this.width+'px';
    this.el.style.height = this.height+'px';
    if (this.allowedToChangeParentsDims && show) {
      this.el.parentElement.style.width = this.el.style.width;
      this.el.parentElement.style.height = this.el.style.height;
      searchForResizables(this.el.parentElement, this.el.style.width, this.el.style.height);
    }
    if (show) {
      this.render();
    }
  };
  function renderElement(el){
    var backingScale = window.devicePixelRatio || 1;
    el.render(this.el.width/backingScale,this.el.height/backingScale,this.ctx);
  }
  Layer.prototype.render = function(){
    var backingScale = window.devicePixelRatio || 1;
    if(!this.sizeFit && this.__children.head && this.__children.head.content){
      this.sizeFit = true;
      var w = this.__children.head.content.dimensions[0], 
        h = this.__children.head.content.dimensions[1],
        ar = w/h,
        mr = this.width/this.height,
        changed = false;
      if(mr>ar){
        changed = true;
        this.width = this.height*ar;
      }else{
        changed = true;
        this.height = this.width/ar;
      }
      if(changed){
        this.onSizeChanged();
        return;
      }
    }
    compositinglib.RenderingParent.prototype.render.call(this);
    //this.ctx.fillStyle = 'rgba(0,0,0,0)';
    this.ctx.strokeStyle = 'rgba(0,0,0,0)';
    this.ctx.clearRect(0,0,this.width*backingScale,this.height*backingScale);
    this.ctx.save();
    this.ctx.scale(backingScale,backingScale);
    this.__children.traverse(renderElement.bind(this));
    this.ctx.restore();
  };
  Layer.prototype.get_visible = function(){
    return this.user_display && this.el && this.el.style && this.el.style.display!=='none';
  };

  Layer.prototype.set_user_display = function (val) {
    this.user_display = val;
  };

  Layer.prototype.fullhide = function () {
    if (!this.get('visible')) return; //nothing to be done
    if (!this.el) return;
    if (!this.el.style) {
      this.el.style = {
        'display': 'none'
      };
    }else{
      this.el.style.display = 'none';
    }
  };

  Layer.prototype.fullshow = function () {
    if (this.get('visible')) return; //nothing to be done
    if (!this.el) return;
    if (!this.el.style) {
      this.el.style = {
        'display': 'block'
      };
    }else{
      this.el.style.display = 'block';
    }
  };

  Layer.HORIZONTAL = 'horizontal';
  Layer.VERTICAL = 'vertical';

  function calculateAllowedToChangeParentDims (orientation, container) {
    var novektrkeeps = mylib.util.elementChildrenCountWithoutClass(container, 'vektrkeep');
    return orientation ? novektrkeeps.length < 2 : !novektrkeeps.length;
  }

  function addTo (container, el) {
    var tfib = mylib.util.elementChildWithClass(container, 'vektrtop');
    if (tfib) {
      container.insertBefore(el, tfib);
      return;
    }
    container.appendChild(el);
  }

  function searchForResizables (el, width, height) {
    var vektrkeepchildren;
    if (!el) {
      return;
    }
    vektrkeepchildren = mylib.util.elementChildrenWithClass(el, 'vektrkeep');
    if (lib.isArray(vektrkeepchildren)) {
      vektrkeepchildren.forEach(function (c) {
        c.style.width = width;
        c.style.height = height;
        c.style.position = 'absolute';
      });
      width = null;
      height = null;
    }
  }
  mylib.Layer = Layer;
}

module.exports = createLayer;

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
function createScene(lib,hierarchymixinslib,compositinglib,mylib){
  'use strict';
  var Layer = mylib.Layer;
  function Scene(containerid, config){
    lib.Destroyable.call(this);
    compositinglib.RenderingParent.call(this);
    this.id = containerid;
    var super_container = document.getElementById(containerid);
    this.container = document.createElement('div');
    this.container.setAttribute('id', super_container.getAttribute('id')+'_canvas_container');
    addTo(super_container, this.container);

    if(!this.container){
      throw 'Cannot find container element with id '+containerid;
    }

    this.mindOrientation = config.mindOrientation;
    new Layer(this, this.mindOrientation ? Layer.HORIZONTAL : undefined); //it will add self to me
    hierarchymixinslib.Child.call(this,compositinglib.Theater);
  }
  lib.inherit(Scene,compositinglib.RenderingParent);
  Scene.prototype.__cleanUp = function(){
    if (this.container) {
      returnVektrkeepsBack(this.container);
    }
    this.mindOrientation = null;
    hierarchymixinslib.Child.prototype.__cleanUp.call(this);
    this.container = null;
    this.id = null;
    compositinglib.RenderingParent.prototype.__cleanUp.call(this);
    lib.Destroyable.prototype.__cleanUp.call(this);
  };
  Scene.prototype.destroy = lib.Destroyable.prototype.destroy;
  Scene.prototype.get = lib.Gettable.prototype.get;
  Scene.prototype.attachListener = lib.Listenable.prototype.attachListener;
  function renderLayer(layer){
    if(layer.dirty){
      layer.render();
    }
  }
  function flushLayer (layer) {
    layer.dirty = true;
    layer.render();
  }
  Scene.prototype.flush = function () {
    compositinglib.RenderingParent.prototype.render.call(this);
    this.__children.traverse(flushLayer);
  };
  Scene.prototype.render = function(){
    compositinglib.RenderingParent.prototype.render.call(this);
    this.__children.traverse(renderLayer);
  };
  function layerFinderByOrdinal(findobj,layer){
    if(findobj.target===findobj.ordinal){
      return layer;
    }
    findobj.ordinal++;
  }
  function get_orientation (mindOrientation, index) {
    return mindOrientation ? (index%2 === 0 ? Layer.HORIZONTAL : Layer.VERTICAL): undefined;
  }
  Scene.prototype.getLayer = function(layerindex){
    var findobj = {target:layerindex,ordinal:0},
      layer = this.__children.traverseConditionally(layerFinderByOrdinal.bind(null,findobj));
    if(!layer){
      var currchildrencount = this.__children.length;
      for(var i=currchildrencount; i<layerindex; i++){
        new Layer(this, get_orientation(this.get('mindOrientation'), i));
      }
      layer = new Layer(this, get_orientation(this.get('mindOrientation'), layerindex));
      if(this.__children.length!==layerindex+1){
        throw new Error('OBOE');
      }
    }
    return layer;
  };
  Scene.prototype.assign = function(controller,layerindex){
    this.getLayer(layerindex).addChild(controller);
  };
  Scene.prototype.sendMouseToLayer = function(srclayer,evntname,evnt,layer){
    if(srclayer.__childindex === layer.__childindex){
      return;
    }
    if (!layer.get('visible')) return;
    layer.environments.mouse[evntname](evnt,true);
  };
  Scene.prototype.distributeMouse = function(layer,evntname,evnt){
    //console.log(evntname,'from layer',layer.__childindex);
    this.__children.traverse(this.sendMouseToLayer.bind(this,layer,evntname,evnt));
  };


  function addTo (container, el) {
    var parentsvektrkeeps = mylib.util.elementChildrenWithClass(container, 'vektrkeep');
    if (lib.isArray(parentsvektrkeeps) && parentsvektrkeeps.length>0) {
      parentsvektrkeeps.forEach(reparenter.bind(null, el));
    }
    container.appendChild(el);
  }

  function returnVektrkeepsBack (el) {
    if (!(el && el.parentElement)) {
      console.error(el, 'has no parent');
      return;
    }
    var vektrkeeps = mylib.util.elementChildrenWithClass(el, 'vektrkeep');
    if (lib.isArray(vektrkeeps) && vektrkeeps.length>0) {
      vektrkeeps.forEach(reparenter.bind(null, el.parentElement));
    }
  }

  function reparenter (el, chld) {
    el.appendChild(chld);
  }


  mylib.Scene = Scene;
}

module.exports = createScene;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
function createUtil (lib, mylib) {
  function traverseElementChildren (el, cb) {
    var cs, i, c, cbret;
    if (!el) {
      return;
    }
    if (!el.children) {
      return;
    }
    cs = el.children;
    for (i=0; i<cs.length; i++) {
      c = cs[i];
      cbret = cb(c);
      if ('undefined' !== typeof cbret) {
        return cbret;
      }
    }
    return;
  }

  function elementChildrenWithClass (el, classname) {
    var ret = [],
      _r = ret;
    traverseElementChildren(el, function (child) {
      if (child.className.split(' ').indexOf(classname)>=0) {
        _r.push(child);
      }
    });
    classname = null;
    _r = null;
    return ret;
  }

  function elementChildWithClass (el, classname) {
    var ret = traverseElementChildren(el, function (child) {
      if (child.className.split(' ').indexOf(classname)>=0) {
        return child;
      }
    });
    classname = null;
    return ret || null;
  }

  function elementChildrenCountWithoutClass (el, classname) {
    var cntobj = {cnt: 0}, ret;
    traverseElementChildren(el, function (child) {
      if (child.className.split(' ').indexOf(classname)<0) {
        cntobj.cnt++;
      }
    });
    classname = null;
    ret = cntobj.cnt;
    cntobj = null;
    return ret;
  }

  mylib.util.traverseElementChildren = traverseElementChildren;
  mylib.util.elementChildrenWithClass = elementChildrenWithClass;
  mylib.util.elementChildWithClass = elementChildWithClass;
  mylib.util.elementChildrenCountWithoutClass = elementChildrenCountWithoutClass;
}

module.exports = createUtil;

},{}]},{},[1]);
