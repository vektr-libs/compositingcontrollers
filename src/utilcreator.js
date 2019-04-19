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
  mylib.util.traverseElementChildren = traverseElementChildren;
  mylib.util.elementChildrenWithClass = elementChildrenWithClass;
  mylib.util.elementChildWithClass = elementChildWithClass;
}

module.exports = createUtil;
