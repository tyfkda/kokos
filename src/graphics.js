// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return (window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          });
})();

window.requestInterval = function(update, draw, delay) {
  var start = TimeUtil.getRawTime();
  var handle = new Object();
  function loop() {
    var current = TimeUtil.getRawTime();
    var delta = current - start;
    if (delta >= delay) {
      var step = Math.floor(delta / delay);
      start += step * delay;  // Next time.
      if (update) {
        if (step >= 10)  // Threshold.
          step = 1;
        for (var i = 0; i < step; ++i)
          update();
      }
      if (draw)
        draw();
    }
    handle.value = requestAnimFrame(loop);
  };
  handle.value = requestAnimFrame(loop);
  return handle;
};

window.clearRequestInterval = function(handle) {
  window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
    window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
    window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
    window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
    window.oCancelRequestAnimationFrame? window.oCancelRequestAnimationFrame(handle.value) :
    window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
    clearInterval(handle);
};

// 指定のアスペクト比に合うようなdivを生成する
function createDesignResolutionDiv(width, height, aspectRatio) {
  'use strict';
  var w = width, h = height;
  if (width / height >= aspectRatio) {
    w = Math.round(height * aspectRatio);
  } else {
    h = Math.round(width / aspectRatio);
  }
  var div = document.createElement('div');
  div.width = w;
  div.height = h;
  div.style.width = w + 'px';
  div.style.height = h + 'px';
  return div;
}

// 指定のサイズの比でウィンドウ全体を占めるキャンバスを生成、bodyに追加
function createFullScreenCanvas(aspectRatio, parent) {
  'use strict';
  var container = createDesignResolutionDiv(window.innerWidth, window.innerHeight, aspectRatio);
  container.style.overflow = 'hidden';

  var canvas = document.createElement('canvas');
  canvas.style.width = container.width + 'px';
  canvas.style.height = container.height + 'px';
  canvas.width = container.width * window.devicePixelRatio;
  canvas.height = container.height * window.devicePixelRatio;

  container.appendChild(canvas);
  container.style.position = 'absolute';
  container.style.left = ((window.innerWidth - container.width) / 2) + 'px';
  container.style.top = ((window.innerHeight - container.height) / 2) + 'px';
  parent.appendChild(container);

  return canvas;
}

// ２次元ベクトル
var Point = (function() {
  'use strict';
  var Point = function(x, y) {
    this.set(x, y);
  };
  Point.prototype = {
    // 代入
    set: function(x, y) {
      if (x instanceof Point) {
        this.x = x.x;
        this.y = x.y;
      } else {
        this.x = x;
        this.y = y;
      }
    },
    // 加算
    add: function(a, b) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
    },
    // 減算
    sub: function(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
    },
    // 長さ
    length: function() {
      return Math.sqrt(this.sqLength());
    },
    // 長さの２乗
    sqLength: function() {
      return this.x * this.x + this.y * this.y;
    },
    // 内積
    dot: function(b) {
      return this.x * b.x + this.y * b.y;
    },
  };
  return Point;
})();

// グラフィクス
var Graphics = (function() {
  'use strict';
  var Graphics = function(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.scale = window.devicePixelRatio;
    this.width = canvas.width;
    this.height = canvas.height;
  };

  function registerEventListener(node, name, listener) {
    node.addEventListener(name, listener, false);
    if (!node.listeners)
      node.listeners = {};
    if (!node.listeners[name])
      return node.listeners[name] = [listener];
    node.listeners[name].push(listener);
  }

  function unregisterEventListener(node, name) {
    if (!node.listeners || !node.listeners[name])
      return;
    var listeners = node.listeners[name];
    for (var i = 0; i < listeners.length; ++i)
      node.removeEventListener(name, listeners[i], false);
    node.listeners[name].length = 0;
  }

  // カラー値を返す
  Graphics.color = function(r, g, b) {  /* r,g,b = 0~255 */
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };

  // タッチイベントの設定
  // PCで確認しやすくするために、mouseイベントにも反映させる
  Graphics.setTouchEvents = function(node, touchStart, touchMove, touchEnd) {
    if (touchStart)
      registerEventListener(node, 'touchstart', touchStart);
    if (touchMove)
      registerEventListener(node, 'touchmove', touchMove);
    if (touchEnd)
      registerEventListener(node, 'touchend', touchEnd);

    if (!GawaNative.isTouch) {
      var dragging = false;
      registerEventListener(node, 'mousedown', function(event) {
        dragging = true;
        if (touchStart)
          return touchStart(event);
        return false;
      });
      if (touchMove)
        registerEventListener(node, 'mousemove', function(event) {
          if (dragging)
            return touchMove(event);
        });
      registerEventListener(node, 'mouseup', function(event) {
        if (touchEnd)
          touchEnd(event);
        dragging = false;
      });
    }
  };

  Graphics.prototype = {
    // スケールの設定
    setDesignScale: function(scale) {
      this.scale = scale;
    },
    // カラー値を返す
    color: Graphics.color,
    setStrokeStyle: function(style) {
      this.context.strokeStyle = style;
    },
    setLineWidth: function(width) {
      this.context.lineWidth = width * this.scale;
    },
    setLineCap: function(cap) {
      this.context.lineCap = cap;
    },
    setFillStyle: function(style) {
      this.context.fillStyle = style;
    },
    fillRect: function(x, y, w, h) {
      var scale = this.scale;
      this.context.fillRect(x * scale, y * scale, w * scale, h * scale);
    },
    fillCircle: function(x, y, r) {
      var scale = this.scale;
      this.context.beginPath();
      this.context.arc(x * scale, y * scale, r * scale, 0, 2 * Math.PI, false);
      this.context.fill();
    },
    drawImage: function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      var scale = this.scale;
      if (sw === undefined)
        this.context.drawImage(image, sx * scale, sy * scale, image.width * scale, image.height * scale);
      else if (dx === undefined)
        this.context.drawImage(image, sx * scale, sy * scale, sw * scale, sh * scale);
      else
        this.context.drawImage(image, sx, sy, sw, sh, dx * scale, dy * scale, dw * scale, dh * scale);
    },
    fillText: function(text, x, y) {
      var scale = this.scale;
      this.context.fillText(text, x * scale, y * scale);
    },
    beginPath: function() { return this.context.beginPath(); },
    moveTo: function(x, y) { return this.context.moveTo(x * this.scale, y * this.scale); },
    lineTo: function(x, y) { return this.context.lineTo(x * this.scale, y * this.scale); },
    stroke: function() { return this.context.stroke(); },
    line: function(x1, y1, x2, y2) {
      this.context.beginPath();
      this.context.moveTo(x1 * this.scale, y1 * this.scale);
      this.context.lineTo(x2 * this.scale, y2 * this.scale);
      this.context.stroke();
    },
    // 座標配列を線分として描画
    lines: function(points) {
      if (points.length <= 1)
        return;
      var scale = this.scale;
      this.context.beginPath();
      this.context.moveTo(points[0].x * scale, points[0].y * scale);
      for (var j = 1; j < points.length; ++j)
        this.context.lineTo(points[j].x * scale, points[j].y * scale);
      this.context.stroke();
    },
    setFont: function(fontName) {
      this.context.font = fontName;
    },
    saveContext: function() {
      this.context.save();
    },
    restoreContext: function() {
      this.context.restore();
    },
    translate: function(x, y) { return this.context.translate(x * this.scale, y * this.scale); },
    rotate: function(angle) { return this.context.rotate(angle); },


    // 描画関数の設定
    setRenderFunc: function(update, draw, delay) {
      var self = this;
      if (self.renderFuncHandler)
        clearRequestInterval(self.renderFuncHandler);
      if ((update || draw) && delay > 0)
        self.renderFuncHandler = requestInterval(update, draw ? (function() {
          self._calcFps();
          draw();
        }) : draw, delay);
      else
        self.renderFuncHandler = null;
    },

    // FPS計算
    fps: 0,
    _calcFps: (function() {
      var prev = TimeUtil.getRawTime();
      var nDraw = 0;
      return function() {
        ++nDraw;
        var now = TimeUtil.getRawTime();
        if (now - prev >= 1000) {
          this.fps = nDraw;
          prev += 1000;
          nDraw = 0;
        }
      };
    })(),

    removeAllTouchEventListeners: function(node) {
      var kEventNames = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup'];
      for (var i = 0; i < kEventNames.length; ++i)
        unregisterEventListener(node, kEventNames[i]);
    },

    // キャンバスのタッチ位置を取得
    getCanvasTouchPoint: function(event) {
      var rect = event.target.getBoundingClientRect();
      var invs = window.devicePixelRatio / this.scale;
      if ('touches' in event) {
        var touch = event.touches[0];
        return new Point((touch.clientX - rect.left) * invs, (touch.clientY - rect.top) * invs);
      }
      return new Point((event.clientX - rect.left) * invs, (event.clientY - rect.top) * invs);
    },
  };
  return Graphics;
})();
