var Sound = (function() {
  'use strict';

  var seTable = {};

  var Sound = {
    playBgm: function(fileName) {
      var audio = new Audio(fileName);
      audio.load();
      audio.loop = true;
      audio.play();
      return audio;
    },

    playSe: function (fileName, callback) {
      var audio;
      if (callback) {
        audio = new Audio(fileName);
        audio.load();
        audio.addEventListener('ended', callback, false);
      } else if (!(fileName in seTable)) {
        audio = seTable[fileName] = new Audio(fileName);
        audio.load();
      } else {
        audio = seTable[fileName];
        audio.currentTime = 0;
      }
      audio.play();
    },

    goAfterAudio: function(id, url) {
      var audio = document.getElementById(id);
      audio.addEventListener('ended', function() {
        window.location = url;
      }, false);
      audio.play();
      return false;
    },
  };

  return Sound;
})();
