'use strict';

var GawaNative = (function() {
  var PORT = 12345;  // Ajaxに使うポート番号

  // ガワネイティブアプリか？
  var isNative = window.navigator.userAgent.indexOf('GawaNative') >= 0;

  // iOS機種か？
  var isIos = (window.navigator.userAgent.indexOf('iPhone') >= 0 ||
               window.navigator.userAgent.indexOf('iPad') >= 0);

  // Androidか？
  var isAndroid = window.navigator.userAgent.indexOf('Android') >= 0;

  if (isNative) {
    // iOS上で動かした時にXcodeのコンソールに出力する
    console = new Object();
    console.log = function(log) {
      window.location.href = 'log:' + log;
    };
    console.debug = console.log;
    console.info = console.log;
    console.warn = console.log;
    console.error = console.log;

    window.onerror = function(errMsg, url, lineNumber) {
      console.error(errMsg + ', file=' + url + ':' + lineNumber);
    };
  }

  var GawaNative = {
    isNative: isNative,
    isIos: isIos,
    isAndroid: isAndroid,
    isTouch: isIos || isAndroid,
  };

  function createQuery(object) {
    var query = '';
    if (object) {
      for (var key in object) {
        if (query.length != 0)
          query += '&';
        var value = object[key];
        if (typeof(value) == 'object')
          value = JSON.stringify(value);
        query += key + '=' + encodeURI(object[key]);
      }
    }
    return query;
  }

  function ajax(method, url, body, async, onSuccess, onFailure) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          if (200 <= xhr.status && xhr.status < 300) {
            onSuccess(xhr.responseText);
          } else {
            if (onFailure)
              onFailure(xhr.status);
          }
        }
      };
      xhr.open(method, url, async);
      if (method === 'POST')
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(body);
    } catch (e) {
      // PCで動かす場合にリクエストがハンドルされないと失敗してこちらにくる
      if (onFailure)
        onFailure();
    }
  }

  GawaNative.notifyAction = function(action, object) {
    var query = createQuery(object);
    if (isNative) {
      window.location.href = 'notify://' + action + '/?' + query;
    } else {
      console.log(action + '/?' + query);
    }
  };

  GawaNative.getAjax = function(action, object, onSuccess, onFailure) {
    var query = createQuery(object);
    var url;
    if (isNative)
      url = 'native://' + action + '/?' + query;
    else
      url = 'http://' + action + ':' + PORT + '/?' + query;
    ajax('GET', url, null, false, onSuccess, onFailure);
  };

  GawaNative.postAjax = function(action, object, onSuccess, onFailure) {
    var query = createQuery(object);
    var url;
    if (isNative)
      url = 'http://native/' + action;
    else
      url = 'http://' + action + ':' + PORT + '/';
    ajax('POST', url, query, false, onSuccess, onFailure);
  };

  GawaNative.postAjaxRaw = function(action, data, onSuccess, onFailure) {
    var url;
    if (isNative)
      url = 'http://native/' + action;
    else
      url = 'http://' + action + ':' + PORT + '/';
    ajax('POST', url, data, false, onSuccess, onFailure);
  };

  return GawaNative;
})();
