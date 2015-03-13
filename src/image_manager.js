var ImageManager = (function() {
  'use strict';

  var images = {};

  // 画像の読み込み
  function loadImage(url, callback) {
    var img = new Image();
    if (callback)
      img.onload = callback;
    img.src = url;
    return img;
  }

  var ImageManager = {
    loadImages: function(base, urls, callback) {
      var self = this;
      var f = null;
      if (callback) {
        var count = urls.length;
        f = function() {
          if (--count <= 0)
            callback();
        };
      }
      for (var i = 0; i < urls.length; ++i) {
        var url = urls[i];
        images[url] = loadImage(base + url, f);
      }
    },
    get: function(name) {
      return images[name];
    },
  };
  return ImageManager;
})();
