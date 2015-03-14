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
    addChild: function(node) {
      var self = this;
      self.children.push(node);
    },
    removeChild: function(node) {
      var self = this;
      var children = self.children;
      var len = children.length;
      for (var i = 0; i < len; ++i)
        if (children[i] == node) {
          children.splice(i, 1);
          break;
        }
    },
    draw: function(G) {
      var self = this;
      var children = self.children;
      var len = children.length;
      for (var i = 0; i < len; ++i)
        children[i].draw(G);
    },

    runAction: function(action) {
      var self = this;
      var actionRunner = new ActionRunner(action);
      actionRunner.update(self, 0);  // 時間0で初期化
      self.actionRunners.push(actionRunner);
    },
    update: function(dt) {
      var self = this;
      executeActionRunners(self, dt);

      var children = self.children;
      for (var i = 0; i < children.length; ++i)
        children[i].update(dt);
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
    init: function(image, x, y) {
      var self = this;
      Super.call(self);
      self.image = image;
      self.color = Graphics.color(255, 255, 255);
      self.alpha = 1.0;
      self.pos = new Point(x, y);
      self.scale = new Point(1, 1);
      self.anchorPoint = new Point(0.5, 0.5);
      self.rotate = 0;
    },
    setImage: function(image) {
      var self = this;
      self.image = image;
    },
    draw: function(G) {
      var self = this;
      G.saveContext();
      G.context.translate(self.pos.x, self.pos.y);
      G.context.rotate(self.rotate);
      var x = -self.anchorPoint.x * self.image.width * self.scale.x;
      var y = -self.anchorPoint.y * self.image.height * self.scale.y;
      var w = self.image.width * self.scale.x;
      var h = self.image.height * self.scale.y;
      G.setFillStyle(self.color);
      G.context.globalAlpha = self.alpha;
      G.drawImage(self.image, x, y, w, h);

      // 子供の描画呼び出し
      Super.prototype.draw.call(self, G);
      G.restoreContext();
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
    setFont: function(fontSize, fontName) {
      var self = this;
      self.fontSize = fontSize;
      self.fontName = fontName || kDefaultFont;
      self.font = null;
      self.measuredSize.x = -1;  // Clear.
    },
    setText: function(text) {
      var self = this;
      self.text = text || '';
      self.measuredSize.x = -1;  // Clear.
    },
    setColor: function(color) {
      var self = this;
      self.color = color;
    },
    draw: function(G) {
      var self = this;

      G.saveContext();
      if (!self.font)
        self.font = Math.round(self.fontSize * self.scale.x * G.scale) + "px '" + self.fontName + "'";

      G.setFont(self.font);
      if (self.measuredSize.x < 0) {
        var metrics = G.context.measureText(self.text);
        self.measuredSize.x = metrics.width / G.scale;
        self.measuredSize.y = self.fontSize * self.scale.y;  //metrics.height;
      }

      var x = self.pos.x - self.anchorPoint.x * self.measuredSize.x * self.scale.x;
      var y = self.pos.y - (self.anchorPoint.y - 1) * self.measuredSize.y * self.scale.y;

      G.setFillStyle(self.color);
      G.context.globalAlpha = self.alpha;
      G.fillText(self.text, x, y);

      // 子供の描画呼び出し
      Super.prototype.draw.call(self, G);

      G.restoreContext();
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
    },
  });
  return Scene;
})();
