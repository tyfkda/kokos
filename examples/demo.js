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

      var sprite = new Sprite(img)
        .setPos(G.width / 2, G.height / 2)
        .addTo(self);

      new Sprite(img)
        .setPos(150, 0)
        .setScale(0.5, 0.5)
        .addTo(sprite);

      new Label('Hello, world!')
        .setPos(50, 50)
        .setFont(30, 'Monotype')
        .setColor(G.color(0, 0, 0))
        .addTo(self);

      var touchStart = function(event) {
        var pos = G.getCanvasTouchPoint(event);
        sprite.stopAllActions();
        Action.moveTo(pos).ease(ActionEase.quadInOut).duration(0.5).applyTo(sprite);
        return false;
      };
      var touchMove = null;
      var touchEnd = null;
      Graphics.setTouchEvents(canvas, touchStart, touchMove, touchEnd);
    },
    draw: function(G) {
      var self = this;

      Super.prototype.draw.call(self, G);

      G.setFillStyle(G.color(255, 0, 0));
      G.fillRect(50, 100, 100, 100);

      G.setFillStyle(G.color(0, 255, 0));
      G.fillCircle(250, 150, 50);

      G.setStrokeStyle(G.color(0, 0, 255));
      G.setLineWidth(10);
      G.setLineCap('round');
      G.line(350, 100, 450, 200);
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
      scene.traverseUpdate(1.0 / fps);
    },

    // Draw
    function() {
      scene.traverseDraw(G);
    },

    1000 / fps
  );
});
