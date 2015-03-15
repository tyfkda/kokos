var Action = (function() {
  'use strict';

  var ActionDuration, ActionRepeat, ActionEase;

  var Action = defineClass({
    update: function(target, time) {
      if (time >= 1)
        time = 1;
      return time;
    },
    isFinished: function(time) {
      return time >= 1;
    },

    // modifier.
    repeat: function(times) {
      return new ActionRepeat(times, this);
    },
    ease: function(f) {
      return new ActionEase(f, this);
    },
    duration: function(duration) {
      return new ActionDuration(duration, this);
    },

    // apply.
    applyTo: function(node) {
      return node.runAction(this);
    },
  });

  ActionDuration = (function() {
    var Super = Action;
    return defineClass({
      parent: Super,
      init: function(duration, action) {
        var self = this;
        Super.call(self);
        self.duration = duration;
        self.action = action;
      },
      update: function(target, time) {
        var self = this;
        if (self.duration > 0)
          return self.action.update(target, time / self.duration) * self.duration;
        self.action.update(target, time == 0 ? 0 : 1);
        return 0;
      },
      isFinished: function(time) {
        var self = this;
        return time >= self.duration;
      },
    });
  })();

  ActionRepeat = (function() {
    var Super = Action;
    return defineClass({
      parent: Super,
      init: function(times, action) {
        var self = this;
        Super.call(self);
        self.count = 0;
        self.times = times;
        self.action = action;
        self.finished = false;
      },
      update: function(target, time) {
        var self = this;
        if (time == 0) {
          self.finished = false;
        }

        do {
          var nextTime = self.action.update(target, time);
          if (!self.action.isFinished(nextTime))
            return nextTime;
          if (self.times > 0 && ++self.count >= self.times) {
            self.finished = true;
            return time;
          }

          time -= nextTime;
          self.action.update(target, 0);  // 再初期化
        } while (time > 0);
        return time;
      },
      isFinished: function(time) {
        var self = this;
        return self.finished;
      },
    });

    return ActionRepeat;
  })();

  ActionEase = (function() {
    var Super = Action;
    return defineClass({
      parent: Super,
      init: function(f, action) {
        var self = this;
        Super.call(self);
        self.action = action;
        self.f = f;
      },
      update: function(target, time) {
        var self = this;
        var modifiedTime = time;
        if (time >= 1)
          modifiedTime = time = 1;
        else
          modifiedTime = self.f(time);
        self.action.update(target, modifiedTime);
        return time;
      },
    });
  })();

  return Action;
})();

// アクションランナー
var ActionRunner = (function() {
  'use strict';

  var ActionRunner = defineClass({
    init: function(action) {
      var self = this;
      self.time = 0;
      self.action = action;
    },
    update: function(target, dt) {
      var self = this;
      self.time = self.action.update(target, self.time + dt);
      return !self.action.isFinished(self.time);
    },
  });

  return ActionRunner;
})();

// シーケンスアクション
var ActionSequence = (function() {
  'use strict';

  var Super = Action;
  var ActionSequence = defineClass({
    parent: Super,
    init: function(actions) {
      var self = this;
      Super.call(self);
      self.actions = actions;
      self.index = 0;
      self.finished = false;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.index = 0;
        self.finished = false;
      }

      var elapsed = 0;
      var action = self.actions[self.index];
      do {
        var nextTime = action.update(target, time);
        if (!action.isFinished(nextTime))  // まだこのアクションが終わってない
          return nextTime;

        time -= nextTime;
        elapsed += nextTime;
        if (++self.index >= self.actions.length) {  // 全てのアクションを実行し終えた
          self.finished = true;
          return elapsed;
        }
        action = self.actions[self.index];
        action.update(target, 0);  // 次のアクションの初期化呼び出し
      } while (time > 0);
      return time;
    },
    isFinished: function(time) {
      var self = this;
      return self.finished;
    },
  });

  return ActionSequence;
})();

// ウェイト
var ActionWait = Action;

// フェード
var ActionFadeTo = (function() {
  'use strict';
  var Super = Action;
  var ActionFadeTo = defineClass({
    parent: Super,
    init: function(alpha) {
      var self = this;
      Super.call(self);
      self.targetAlpha = alpha;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialAlpha = target.alpha;
      } else {
        if (time >= 1)
          time = 1;
        target.alpha = (self.targetAlpha - self.initialAlpha) * time + self.initialAlpha;
      }
      return time;
    },
  });
  return ActionFadeTo;
})();

// フェードアウト
var ActionFadeOut = (function() {
  'use strict';
  var Super = ActionFadeTo;
  var ActionFadeOut = defineClass({
    parent: Super,
    init: function() {
      var self = this;
      Super.call(self, 0);
    },
  });
  return ActionFadeOut;
})();

// 移動
var ActionMoveTo = (function() {
  'use strict';

  var Super = Action;
  var ActionMoveTo = defineClass({
    parent: Super,
    init: function(x, y) {
      var self = this;
      Super.call(self);
      if (x instanceof Point) {
        self.targetX = x.x;
        self.targetY = x.y;
      } else {
        self.targetX = x;
        self.targetY = y;
      }
      self.initialX = self.initialY = 0;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialX = target.pos.x;
        self.initialY = target.pos.y;
      } else {
        if (time >= 1)
          time = 1;
        target.setPos((self.targetX - self.initialX) * time + self.initialX,
                      (self.targetY - self.initialY) * time + self.initialY);
      }
      return time;
    },
  });

  return ActionMoveTo;
})();

// スケール
var ActionScaleTo = (function() {
  'use strict';

  var Super = Action;
  var ActionScaleTo = defineClass({
    parent: Super,
    init: function(x, y) {
      var self = this;
      Super.call(self);
      if (x instanceof Point) {
        self.targetX = x.x;
        self.targetY = x.y;
      } else {
        self.targetX = x;
        self.targetY = y != null ? y : x;
      }
      self.initialX = self.initialY = 0;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialX = target.scale.x;
        self.initialY = target.scale.y;
      } else {
        if (time >= 1)
          time = 1;
        target.setScale((self.targetX - self.initialX) * time + self.initialX,
                        (self.targetY - self.initialY) * time + self.initialY);
      }
      return time;
    },
  });

  return ActionScaleTo;
})();

// 関数呼び出し
var ActionCall = (function() {
  'use strict';

  var Super = Action;
  var ActionCall = defineClass({
    parent: Super,
    init: function(func) {
      var self = this;
      Super.call(self, 1);
      self.func = func;
    },
    update: function(target, time) {
      var self = this;
      if (time > 0)
        self.func.apply(target);
      return 0;
    },
    isFinished: function(time) {
      return true;
    },
  });

  return ActionCall;
})();

// 関数随時呼び出し
var ActionUpdate = (function() {
  'use strict';

  var Super = Action;
  var ActionUpdate = defineClass({
    parent: Super,
    init: function(func) {
      var self = this;
      Super.call(self);
      self.func = func;
    },
    update: function(target, time) {
      var self = this;
      if (time >= 1)
        time = 1;
      self.func.call(target, time);
      return time;
    },
  });

  return ActionUpdate;
})();

// Ease functions.
var Ease = (function() {
  'use strict';

  var flip = function(f) {
    return function(t) {
      return 1.0 - f(1.0 - t);
    };
  };

  var inOut = function(f) {
    return function(t) {
      if (t <= 0.5)
        return f(t * 2) / 2;
      else
        return 1.0 - f((1.0 - t) * 2) / 2;
    };
  };

  var quadIn = function(t) {
    return t * t;
  };
  var cubicIn = function(t) {
    return t * t * t;
  };

  return {
    quadIn: quadIn,
    quadOut: flip(quadIn),
    quadInOut: inOut(quadIn),
    cubicIn: cubicIn,
    cubicOut: flip(cubicIn),
    cubicInOut: inOut(cubicIn),
  };
})();
