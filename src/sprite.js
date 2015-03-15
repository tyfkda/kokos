// ノード
var Node = (function() {
  'use strict';

  function executeActionRunners(self, dt) {
    var n = self.actionRunners.length;
    for (var i = 0; i < n; ++i) {
      var actionRunner = self.actionRunners[i];
      if (!actionRunner.update(self, dt)) {
        self.actionRunners.splice(i, 1);
        --i;
        --n;
      }
    }
  }

  var Node = defineClass({
    init: function() {
      var self = this;
      self.children = [];
      self.actionRunners = [];
    },
    addTo: function(node) {
      var self = this;
      node.children.push(self);
      return self;
    },
    removeFrom: function(node) {
      var self = this;
      var children = node.children;
      var len = children.length;
      for (var i = 0; i < len; ++i)
        if (children[i] == node) {
          children.splice(i, 1);
          break;
        }
      return self;
    },
    traverseDraw: function(G) {
      var self = this;
      self.beforeDraw(G);
      self.draw(G);
      var children = self.children;
      var len = children.length;
      for (var i = 0; i < len; ++i)
        children[i].traverseDraw(G);
      self.afterDraw(G);
    },
    beforeDraw: function(G) {
      G.saveContext();
    },
    draw: function(G) {
    },
    afterDraw: function(G) {
      G.restoreContext();
    },

    runAction: function(action) {
      var self = this;
      var actionRunner = new ActionRunner(action);
      actionRunner.update(self, 0);  // 時間0で初期化
      self.actionRunners.push(actionRunner);
      return self;
    },
    stopAllActions: function() {
      var self = this;
      self.actionRunners.length = 0;
      return self;
    },
    traverseUpdate: function(dt) {
      var self = this;
      self.update(dt);
      var children = self.children;
      for (var i = 0; i < children.length; ++i)
        children[i].traverseUpdate(dt);
    },
    update: function(dt) {
      var self = this;
      executeActionRunners(self, dt);
    },
  });

  return Node;
})();

// スプライト
var Sprite = (function() {
  'use strict';

  var Super = Node;
  var Sprite = defineClass({
    parent: Super,
    init: function(image) {
      var self = this;
      Super.call(self);
      self.image = image;
      self.color = Graphics.color(255, 255, 255);
      self.alpha = 1.0;
      self.pos = new Point(0, 0);
      self.scale = new Point(1, 1);
      self.anchorPoint = new Point(0.5, 0.5);
      self.rotate = 0;
    },
    setPos: function(x, y) {
      var self = this;
      self.pos.set(x, y);
      return self;
    },
    setAnchorPoint: function(x, y) {
      var self = this;
      self.anchorPoint.set(x, y);
      return self;
    },
    setScale: function(x, y) {
      var self = this;
      self.scale.set(x, y != null ? y : x);
      return self;
    },
    setAlpha: function(alpha) {
      var self = this;
      self.alpha = alpha;
      return self;
    },
    setImage: function(image) {
      var self = this;
      self.image = image;
      return self;
    },
    draw: function(G) {
      var self = this;
      G.translate(self.pos.x, self.pos.y);
      G.rotate(self.rotate);
      var x = -self.anchorPoint.x * self.image.width * self.scale.x;
      var y = -self.anchorPoint.y * self.image.height * self.scale.y;
      var w = self.image.width * self.scale.x;
      var h = self.image.height * self.scale.y;
      G.setFillStyle(self.color);
      G.context.globalAlpha = self.alpha;
      G.drawImage(self.image, x, y, w, h);
    },
  });

  return Sprite;
})();

// ラベル（文字列）
var Label = (function() {
  'use strict';

  var kDefaultFont = 'ＭＳ Ｐゴシック';

  var Super = Node;
  var Label = defineClass({
    parent: Super,
    init: function(text) {
      var self = this;
      Super.call(self);
      self.color = Graphics.color(0, 0, 0);
      self.alpha = 1.0;
      self.pos = new Point(0, 0);
      self.scale = new Point(1, 1);
      self.anchorPoint = new Point(0, 0);
      self.measuredSize = new Point(-1, -1);
      self.setFont(16);
      self.setText(text);
    },
    setPos: function(x, y) {
      var self = this;
      self.pos.set(x, y);
      return self;
    },
    setAnchorPoint: function(x, y) {
      var self = this;
      self.anchorPoint.set(x, y);
      return self;
    },
    setScale: function(x, y) {
      var self = this;
      self.scale.set(x, y != null ? y : x);
      self.measuredSize.x = -1;  // Clear.
      return self;
    },
    setFont: function(fontSize, fontName) {
      var self = this;
      self.fontSize = fontSize;
      self.fontName = fontName || kDefaultFont;
      self.font = null;
      self.measuredSize.x = -1;  // Clear.
      return self;
    },
    setText: function(text) {
      var self = this;
      self.text = text || '';
      self.measuredSize.x = -1;  // Clear.
      return self;
    },
    setColor: function(color) {
      var self = this;
      self.color = color;
      return self;
    },
    setAlpha: function(alpha) {
      var self = this;
      self.alpha = alpha;
      return self;
    },
    draw: function(G) {
      var self = this;
      if (!self.font)
        self.font = Math.round(self.fontSize * self.scale.x * G.scale) + "px '" + self.fontName + "'";

      G.setFont(self.font);
      if (self.measuredSize.x < 0) {
        var metrics = G.context.measureText(self.text);
        self.measuredSize.x = metrics.width / G.scale;
        self.measuredSize.y = self.fontSize * self.scale.y;  //metrics.height;
      }

      G.translate(self.pos.x, self.pos.y);
      G.rotate(self.rotate);

      var x = -self.anchorPoint.x * self.measuredSize.x * self.scale.x;
      var y = -(self.anchorPoint.y - 1) * self.measuredSize.y * self.scale.y;

      G.setFillStyle(self.color);
      G.context.globalAlpha = self.alpha;
      G.fillText(self.text, x, y);
    },
  });
  return Label;
})();

// シーン
var Scene = (function() {
  'use strict';

  var Super = Node;
  var Scene = defineClass({
    parent: Super,
    init: function() {
      var self = this;
      Super.call(self);
      self.bgColor = Graphics.color(255, 255, 255);
    },
    setBackGroundColor: function(color) {
      var self = this;
      self.bgColor = color;
      return self;
    },
    beforeDraw: function(G) {
      var self = this;
      Super.prototype.beforeDraw.call(self, G);
      G.setFillStyle(self.bgColor);
      G.fillRect(0, 0, G.width, G.height);
    },
  });
  return Scene;
})();
