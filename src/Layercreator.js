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
    this.allowedToChangeParentsDims = orientation ? vektrinstance.container.children.length < 2 : !vektrinstance.container.children.length;
    this.el = document.createElement('canvas');
    this.el.style.position = 'absolute';
    vektrinstance.container.appendChild(this.el);
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
      this.el.parentElement.style.position = 'absolute';
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

  function searchForResizables (el, width, height) {
    var vektrkeepchildren;
    if (!(el && el.parentElement)) {
      return;
    }
    vektrkeepchildren = mylib.util.elementChildrenWithClass(el.parentElement, 'vektrkeep');
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
