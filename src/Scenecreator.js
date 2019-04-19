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
    this.container.style.position = 'absolute';
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
    var tfib = mylib.util.elementChildWithClass(container, 'vektrtop');
    if (tfib) {
      container.insertBefore(el, tfib);
      return;
    }
    container.appendChild(el);
  }


  mylib.Scene = Scene;
}

module.exports = createScene;
