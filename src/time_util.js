var TimeUtil = (function() {
  'use strict';

  var getTime = (function() {
    var nowFunc = (window.performance &&
                   (performance.now ||
                    performance.mozNow ||
                    performance.msNow ||
                    performance.oNow ||
                    performance.webkitNow));
    if (nowFunc)
      return nowFunc.bind(performance);
    return Date.now;
  })();

  var beginTime = getTime();

  var TimeUtil = function(){};

  TimeUtil.getRawTime = getTime;
  TimeUtil.reset = function() {
    beginTime = getTime();
  };
  TimeUtil.getCurrentTime = function() {
    return getTime() - beginTime;
  };

  return TimeUtil;
})();
