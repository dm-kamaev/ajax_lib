
// TODO:
// + 1) methods
// + 2) JSON.parse
// + 3) form_urlencoded
// + 4) form_data
// 5) Add support retry
// + 6) Add timeout
// 7) Add option base url
// 8) Add option withCredentials


(function() {
  var _r = {
    content_types: {
      json: function() { return 'application/json'; },
      // simple form
      form_urlencoded: function() { return 'application/x-www-form-urlencoded'; },
      // file upload
      form_data: function() { return 'multiparty/form-data'; },
      text: function() { return 'text/plain'; },
    }
  };

  /**
   * @class
   * Error_timeout - ajax timeout
   * @param {string} msg
   */
  _r.Error_timeout = function (msg) {
    var err = new Error(msg);
    this.message = err.message;
    this.stack = err.stack;
  };

  var empty_function = function() {};

  /**
   * _r.get
   * @param  {string} url    [description]
   * @param  {object{ success: (xhr), error: (xhr) }} cbs
   * @param  { headers: object{ 'Content-Type': string } } option
   * @example
   _r.get('/aj/1', {
     [success]: function(xhr, body) {
       console.log('success=', xhr, body);
     },
     [error]: function(xhr, body) {
       console.log('error=', xhr, body);
     }
   }, {
     [headers]: {
       'content-type': _r.content_types.json(),
     },
     [timeout=5000]: boolean, // ms
   });
   */
  _r.get = function(url, cbs, option) {
    cbs = cbs || {};
    cbs.success = only_one_call(cbs.success);
    cbs.error = only_one_call(cbs.error);

    option = option || {};
    var xhr = get_xhr();
    var timer;
    xhr.open('GET', url, true);

    set_headers(xhr, option.headers);

    xhr.onreadystatechange = function() {
      var body;
      if (timer) {
        clearTimeout(timer);
      }
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 400) {
          if (cbs.success) {
            body = parse_body(xhr);
            if (body instanceof Error) {
              return cbs.error(xhr, body);
            }
            cbs.success(xhr, body);
          }
        } else {
          body = parse_body(xhr);
          if (body instanceof Error) {
            return cbs.error(xhr, body);
          }
          cbs.error(xhr, body);
        }
      }
    };

    // default 5 sec
    var timeout = parseInt(option.timeout, 10) || 5000;
    timer = start_timer(xhr, url, timeout, cbs.error);

    xhr.send(null);

  };


  var list_methods = [ 'POST', 'PUT', 'DELETE' ];
  for (var i = 0, l = list_methods.length; i < l; i++) {
    var method = list_methods[i];
    void function (method) {
      _r[method.toLowerCase()] = function(url, data, cbs, option) {
        cbs = cbs || {};
        cbs.success = only_one_call(cbs.success);
        cbs.error = only_one_call(cbs.error);

        option = option || {};
        var timer;

        var xhr = get_xhr();
        xhr.open(method, url, true);
        set_headers(xhr, option.headers);

        data = str_data(option.headers || {}, data);
        if (data instanceof Error) {
          return cbs.error(xhr, data);
        }

        xhr.onreadystatechange = function() {
          var body;
          if (timer) {
            clearTimeout(timer);
          }
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 400) {
              if (cbs.success) {
                body = parse_body(xhr);
                if (body instanceof Error) {
                  return cbs.error(xhr, body);
                }
                cbs.success(xhr, body);
              }
            } else {
              body = parse_body(xhr);
              if (body instanceof Error) {
                return cbs.error(xhr, body);
              }
              cbs.error(xhr, body);
            }
          }
        };

        // default 5 sec
        var timeout = parseInt(option.timeout, 10) || 5000;
        timer = start_timer(xhr, url, timeout, cbs.error);

        xhr.send(data);

      };
    }(method);
  }

  /**
   * set_headers: set headers in xhr
   * @param {Xhr} xhr
   * @param { object{'Content-type': string } } headers
   */
  function set_headers(xhr, headers) {
    if (headers) {
      for (var header_name in headers) {
        if (headers.hasOwnProperty(header_name)) {
          var value = headers[header_name];
          if (value === _r.content_types.form_data()) {
            continue;
          }
          xhr.setRequestHeader(header_name, value);
        }
      }
    }
  }

  /**
   * parse_body: parse body base on content-type
   * @param  {Xhr} xhr
   * @return {string || object{}}
   */
  function parse_body(xhr) {
    var content_type = xhr.getResponseHeader('Content-Type') || '';
    content_type = content_type.trim();
    var body = xhr.responseText;
    if (/^application\/json/.test(content_type)) {
      try {
        body = JSON.parse(xhr.responseText);
      } catch (err) {
        return err;
      }
    }
    return body;
  }

  /**
   * str_data: handle data before send to server
   * @param  object{'Content-type': string } headers
   * @param  {object{ file: File? }} data
   * @return {string | FormData}
   */
  function str_data(headers, data) {
    var content_type = headers['Content-Type'] || headers['content-type'] || headers['content-Type'];
    var key;
    if (!(data && data instanceof Object)) {
      return data;
    }

    if (/application\/json/.test(content_type)) {
      try {
        data = JSON.stringify(data);
      } catch (err) {
        return err;
      }
    } else if (/application\/x-www-form-urlencoded/.test(content_type)) {
      var res = ''; // 'k=v&k2=v2'
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          res += key+'='+data[key]+'&';
        }
      }
      data = res.replace(/&$/, '');
    } else if (/multiparty\/form-data/.test(content_type)) {
      var fd = new FormData();
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          // method .set not work in ie11!
          fd.append(key, data[key]);
        }
      }
      data = fd;
    }
    return data;
  }


  /**
   * start_timer - start timer for request
   * @param  {XMLHttpRequest} xhr
   * @param  {string} url      timeout
   * @param  {function} cb_error
   * @return {Timeout}
   */
  function start_timer(xhr, url, timeout, cb_error) {
    return setTimeout(function() {
      // order is important, because, when we call abort, then called "onreadystatechange",
      // but callback of error called only once and we lose error object
      cb_error(xhr, new _r.Error_timeout('Ajax timeout error ' + timeout + 'ms url='+url));
      xhr.abort();
    }, timeout);
  }


  /**
   * get_xhr
   * @throws {Error} If not found xhr
   * @return {XMLHttpRequest}
   */
  function get_xhr() {
    var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    if (!xhr) {
      throw new Error('Not found xhr');
    }
    return xhr;
  }


  /**
   * only_one_call
   * @param  {function} fn
   * @return {function}
   */
  function only_one_call(fn) {
    var call = false;
    fn = fn || empty_function;
    return function () {
      if (!call) {
        call = true;
        fn.apply(null, arguments);
      }
    };
  }

  // EXAMPLES
  // _r.get('/aj/1', {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   }
  // });

  // _r.post('/aj/1', {
  //   user_name: 'Vasya'
  // }, {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   }
  // });

  // _r.put('/aj/2', {
  //   user_name: 'Vasya'
  // }, {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   }
  // });


  // _r.delete('/aj/2', {
  //   user_name: 'Vasya'
  // }, {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   }
  // });
  //

  // SEND DATA AS FORM
  // _r.post('/aj//users/1', {
  //   user_name: 'Vasya'
  // }, {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.form_urlencoded(),
  //   }
  // });

  // LOAD FILE
  // document.getElementById('file').onchange = function () {
  //   // send data with upload file
  //   _r.post('/aj/upload/1', {
  //     user_name: 'Vasya',
  //     file: document.getElementById('file').files[0]
  //   }, {
  //     success: function(xhr, body) {
  //       console.log('success=', xhr, body);
  //     },
  //     error: function(xhr, body) {
  //       console.log('error=', xhr, body);
  //     }
  //   }, {
  //     headers: {
  //       'content-type': _r.content_types.form_data(),
  //     }
  //   });
  // };

  // TEST TIMEOUT FOR REQUEST
  // _r.post('/aj/test/long_request', {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   },
  //   /* timeout: 100000, */
  // });

  // POST TEST TIMEOUT FOR REQUEST
  // _r.post('/aj/long_request', { Vasya: 'p12313' } , {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   },
  //   /** timeout: 100000, */
  // });

  // // GET TEST TIMEOUT FOR REQUEST
  // _r.get('/aj/long_request', {
  //   success: function(xhr, body) {
  //     console.log('success=', xhr, body);
  //   },
  //   error: function(xhr, body) {
  //     console.log('error=', xhr, body);
  //   }
  // }, {
  //   headers: {
  //     'content-type': _r.content_types.json(),
  //   },
  //   /** timeout: 100000, */
  // });

}());



