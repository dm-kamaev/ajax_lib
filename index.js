
// TODO:
// + 1) methods
// + 2) JSON.parse
// + 3) form_urlencoded
// + 4) form_data
// 5) Add support retry
// 6) Add timeout


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
    cbs.success = cbs.success || empty_function;
    cbs.error = cbs.error || empty_function;
    var success_cb = cbs.success;
    var error_cb = cbs.error;
    option = option || {};
    var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    if (!xhr) {
      throw new Error('Not found xhr');
    }
    xhr.open('GET', url, true);

    set_headers(xhr, option.headers);

    xhr.onreadystatechange = function() {
      var body;
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 400) {
          if (cbs.success) {
            body = parse_body(xhr);
            if (body instanceof Error) {
              return cbs.error(xhr, body);
            }
            success_cb(xhr, body);
          }
        } else {
          body = parse_body(xhr);
          if (body instanceof Error) {
            return cbs.error(xhr, body);
          }
          error_cb(xhr, body);
        }
      }
    };
    // default 5 sec
    xhr.timeout = parseInt(option.timeout, 10) || 5000;
    console.log(xhr.timeout);
    xhr.send(null);

  };


  var list_methods = [ 'POST', 'PUT', 'DELETE' ];
  for (var i = 0, l = list_methods.length; i < l; i++) {
    var method = list_methods[i];
    void function (method) {
      _r[method.toLowerCase()] = function(url, data, cbs, option) {
        cbs = cbs || {};
        var success_cb = cbs.success = cbs.success || function() {};
        var error_cb = cbs.error = cbs.error || function() {};
        option = option || {};
        var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
        if (!xhr) {
          throw new Error('Not found xhr');
        }
        xhr.open(method, url, true);

        set_headers(xhr, option.headers);

        data = str_data(option.headers || {}, data);
        if (data instanceof Error) {
          return error_cb(xhr, data);
        }

        xhr.onreadystatechange = function() {
          var body;
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 400) {
              if (cbs.success) {
                body = parse_body(xhr);
                if (body instanceof Error) {
                  return cbs.error(xhr, body);
                }
                success_cb(xhr, body);
              }
            } else {
              body = parse_body(xhr);
              if (body instanceof Error) {
                return cbs.error(xhr, body);
              }
              error_cb(xhr, body);
            }
          }
        };
        // default 5 sec
        xhr.timeout = parseInt(option.timeout, 10) || 5000;
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
  _r.get('/aj/timeout_error', {
    success: function(xhr, body) {
      console.log('success=', xhr, body);
    },
    error: function(xhr, body) {
      console.log('error=', xhr, body);
    }
  }, {
    headers: {
      'content-type': _r.content_types.json(),
    }
  });

}());



