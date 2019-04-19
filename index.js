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
