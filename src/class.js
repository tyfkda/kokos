'use strict';

// クラス定義
function defineClass(props) {
  var parent = props.parent;
  var ctor = props.init || (parent ? function() { parent.apply(this, arguments); }
                                   : function() {});
  if (parent)
    ctor.prototype = Object.create(parent.prototype);
  for (var key in props)
    ctor.prototype[key] = props[key];
  return ctor;
}
