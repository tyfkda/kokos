// アクション
var Action = (function() {
  'use strict';

  var Action = defineClass({
    init: function(duration) {
      var self = this;
      self.duration = duration;
    },
    update: function(target, time) {
      var self = this;
      if (time >= self.duration)
        time = self.duration;
      return time;
    },
    isFinished: function(time) {
      var self = this;
      return time >= self.duration;
    },
  });

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
      Super.call(self, 1);  // 適当にdurationを渡す
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
      Super.call(self, 1);  // 適当にdurationを渡す
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

// ウェイト
var ActionWait = (function() {
  'use strict';

  var Super = Action;
  var ActionWait = defineClass({
    parent: Super,
  });

  return ActionWait;
})();

// フェード
var ActionFadeTo = (function() {
  'use strict';
  var Super = Action;
  var ActionFadeTo = defineClass({
    parent: Super,
    init: function(duration, alpha) {
      var self = this;
      Super.call(self, duration);
      self.targetAlpha = alpha;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialAlpha = target.alpha;
      } else {
        if (time >= self.duration)
          time = self.duration;
        var t = time / self.duration;
        target.alpha = (self.targetAlpha - self.initialAlpha) * t + self.initialAlpha;
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
    init: function(duration) {
      var self = this;
      Super.call(self, duration, 0);
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
    init: function(duration, targetPos) {
      var self = this;
      Super.call(self, duration);
      self.targetPos = targetPos;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialPos = new Point(target.pos.x, target.pos.y);
      } else {
        if (time >= self.duration)
          time = self.duration;
        var t = time / self.duration;
        target.pos.set((self.targetPos.x - self.initialPos.x) * t + self.initialPos.x,
                       (self.targetPos.y - self.initialPos.y) * t + self.initialPos.y);
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
    init: function(duration, targetScale) {
      var self = this;
      Super.call(self, duration);
      self.targetScale = targetScale;
    },
    update: function(target, time) {
      var self = this;
      if (time == 0) {
        self.initialScale = new Point(target.scale.x, target.scale.y);
      } else {
        if (time >= self.duration)
          time = self.duration;
        var t = time / self.duration;
        target.scale.set((self.targetScale.x - self.initialScale.x) * t + self.initialScale.x,
                         (self.targetScale.y - self.initialScale.y) * t + self.initialScale.y);
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
    init: function(duration, func) {
      var self = this;
      Super.call(self, duration);
      self.func = func;
    },
    update: function(target, time) {
      var self = this;
      self.func.call(target, time);
      return time;
    },
  });

  return ActionUpdate;
})();
