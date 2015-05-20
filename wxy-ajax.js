(function() {
  var CoreXhr, handlers;

  handlers = {
    xml: function(xhr) {
      return xhr.responseXML;
    },
    text: function(xhr) {
      return xhr.responseText;
    },
    document: function(xhr) {
      return xhr.response;
    },
    arraybuffer: function(xhr) {
      return xhr.response;
    },
    blob: function(xhr) {
      return xhr.response;
    },
    json: function(xhr) {
      var exception, response;
      response = xhr.responseText;
      try {
        return JSON.parse(response);
      } catch (_error) {
        exception = _error;
        console.warn('core-ajax caught an exception trying to parse response as JSON:');
        console.warn(exception);
        return response;
      }
    }
  };

  Polymer({
    is: 'wxy-ajax',
    properties: {
      url: String,
      handleAs: String,
      params: Object,
      method: String,
      headers: String,
      body: String,
      contentType: String,
      withCredentials: Boolean
    },
    ready: function() {
      this.xhr = new CoreXhr();
    },
    send: function(args) {
      var hasContentType, _ref;
      args.headers = args.headers || {};
      hasContentType = Object.keys(args.headers).some(function(header) {
        return header.toLowerCase() === 'content-type';
      });
      if (args.body instanceof FormData) {
        delete args.headers['Content-Type'];
      } else if (!hasContentType && args.contentType) {
        args.headers['Content-Type'] = args.contentType;
      }
      if ((_ref = args.handleAs) === 'arraybuffer' || _ref === 'blob' || _ref === 'document') {
        args.responseType = args.handleAs;
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          args.callback = function(response, xhr) {
            var result;
            if (_this._IsSuccess(xhr)) {
              result = _this._EvalResponse(xhr, args.handleAs);
              return resolve(result);
            } else {
              return reject({
                statusCode: xhr.status,
                response: _this._EvalResponse(xhr, args.handleAs)
              });
            }
          };
          return _this.xhr.request(args);
        };
      })(this));
    },
    _EvalResponse: function(xhr, handleAs) {
      return handlers[handleAs || 'json'](xhr);
    },
    _IsSuccess: function(xhr) {
      var status;
      status = xhr.status || 0;
      return (200 <= status && status < 300);
    },
    _GetParams: function(params) {
      if (params && typeof params === 'string') {
        params = JSON.parse(params);
      }
      return params;
    }
  });

  CoreXhr = Polymer({
    is: 'core-xhr',
    bodyMethods: {
      POST: 1,
      PUT: 1,
      PATCH: 1,
      DELETE: 1
    },
    request: function(options) {
      var async, method, params, url, xhr, xhrParams;
      xhr = new XMLHttpRequest;
      url = options.url;
      method = options.method || 'GET';
      async = !options.sync;
      params = this.toQueryString(options.params);
      if (params && method.toUpperCase() === 'GET') {
        url += (url.indexOf('?') > 0 ? '&' : '?') + params;
      }
      xhrParams = this.isBodyMethod(method) ? options.body || params : null;
      xhr.open(method, url, async);
      if (options.responseType) {
        xhr.responseType = options.responseType;
      }
      if (options.withCredentials) {
        xhr.withCredentials = true;
      }
      this.makeReadyStateHandler(xhr, options.callback);
      this.setRequestHeaders(xhr, options.headers);
      xhr.send(xhrParams);
      if (!async) {
        xhr.onreadystatechange(xhr);
      }
      return xhr;
    },
    toQueryString: function(params) {
      var n, r, v;
      r = [];
      for (n in params) {
        v = params[n];
        n = encodeURIComponent(n);
        r.push(v === null ? n : n + '=' + encodeURIComponent(v));
      }
      return r.join('&');
    },
    isBodyMethod: function(method) {
      return this.bodyMethods[(method || '').toUpperCase()];
    },
    makeReadyStateHandler: function(xhr, callback) {
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          callback && callback.call(null, xhr.response, xhr);
        }
      };
    },
    setRequestHeaders: function(xhr, headers) {
      var name;
      if (headers) {
        for (name in headers) {
          xhr.setRequestHeader(name, headers[name]);
        }
      }
    }
  });

}).call(this);
