// アクション
var Action = (function() {
  'use strict';

  var Action = defineClass({
    init: function() {
      var self = this;
    },
    update: function(target, time) {
      var self = this;
      if (time >= 1)
        time = 1;
      return time;
    },
    isFinished: function(time) {
      var self = this;
      return time >= 1;
    },
  });

  var protos = {
    // base.
    moveTo: function(pos) {
      return new ActionMoveTo(pos);
    },
    scaleTo: function(scale) {
      return new ActionScaleTo(scale);
    },
    fadeTo: function(alpha) {
      return new ActionFadeTo(alpha, this);
    },
    fadeOut: function(alpha) {
      return new ActionFadeTo(0, this);
    },
    sequence: function(actions) {
      return new ActionSequence(actions);
    },
    repeat: function(repeat, action) {
      return new ActionRepeat(repeat, action);
    },

    // modifier.
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
  };
  for (var k in protos)
    Action[k] = Action.prototype[k] = protos[k];

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

// リピートアクション
var ActionRepeat = (function() {
  'use strict';

  var Super = Action;
  var ActionRepeat = defineClass({
    parent: Super,
    init: function(repeat, action) {
      var self = this;
      Super.call(self);
      self.count = 0;
      self.repeat = repeat;
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
        if (self.repeat > 0 && ++self.count >= self.repeat) {
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

// 時間変更
var ActionDuration = (function() {
  'use strict';

  var Super = Action;
  var ActionDuration = defineClass({
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

  return ActionDuration;
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
    init: function(targetPos) {
      var self = this;
      Super.call(self);
      self.targetPos = targetPos;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialPos = new Point(target.pos.x, target.pos.y);
      } else {
        if (time >= 1)
          time = 1;
        target.pos.set((self.targetPos.x - self.initialPos.x) * time + self.initialPos.x,
                       (self.targetPos.y - self.initialPos.y) * time + self.initialPos.y);
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
    init: function(targetScale) {
      var self = this;
      Super.call(self);
      self.targetScale = targetScale;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialScale = new Point(target.scale.x, target.scale.y);
      } else {
        if (time >= 1)
          time = 1;
        target.scale.set((self.targetScale.x - self.initialScale.x) * time + self.initialScale.x,
                         (self.targetScale.y - self.initialScale.y) * time + self.initialScale.y);
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

// Ease
var ActionEase = (function() {
  'use strict';

  var reverse = function(f) {
    return function(t) {
      return f(1.0 - t);
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

  var Super = Action;
  var ActionEase = defineClass({
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

  ActionEase.quadIn = quadIn;
  ActionEase.quadOut = reverse(quadIn);
  ActionEase.quadInOut = inOut(quadIn);
  ActionEase.cubicIn = cubicIn;
  ActionEase.cubicOut = reverse(cubicIn);
  ActionEase.cubicInOut = inOut(cubicIn);

  return ActionEase;
})();
