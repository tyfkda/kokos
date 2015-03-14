var MyScene = (function() {
  'use strict';

  var Super = Scene;
  var MyScene = defineClass({
    parent: Super,
    init: function(G) {
      var self = this;
      Super.call(self);

      var img = new Image();
      img.src = 'img.png';

      self.sprite = new Sprite(img, G.width / 2, G.height / 2);
      self.addChild(self.sprite);

      self.satelite = new Sprite(img, 150, 0);
      self.satelite.scale.set(0.5, 0.5);
      self.sprite.addChild(self.satelite);

      var touchStart = function(event) {
        return true;
      };
      var touchMove = function(event) {
        var pos = G.getCanvasTouchPoint(event);
        self.sprite.pos.set(pos);
      };
      var touchEnd = null;
      Graphics.setTouchEvents(canvas, touchStart, touchMove, touchEnd);
    },
    update: function(dt) {
      var self = this;
    },
    draw: function(G) {
      var self = this;

      G.setFillStyle(G.color(255, 255, 255));
      G.fillRect(0, 0, G.width, G.height);

      Super.prototype.draw.call(self, G);

      G.setFillStyle(G.color(255, 0, 0));
      G.fillRect(50, 100, 100, 100);

      G.setFillStyle(G.color(0, 255, 0));
      G.fillCircle(250, 150, 50);

      G.setStrokeStyle(G.color(0, 0, 255));
      G.setLineWidth(10);
      G.setLineCap('round');
      G.line(350, 100, 450, 200);

      G.setFillStyle(G.color(0, 0, 0));
      G.setFont("30px 'Monotype'");
      G.fillText('Hello, world!', 50, 50);
    },
  });
  return MyScene;
})();

window.addEventListener('load', function() {
  'use strict';

  var canvas = document.getElementById('canvas');
  var G = new Graphics(canvas);
  var scene = new MyScene(G);

  var fps = 60;
  G.setRenderFunc(
    // Update
    function() {
      scene.update(1.0 / fps);
    },

    // Draw
    function() {
      scene.draw(G);
    },

    1000 / fps
  );
});
