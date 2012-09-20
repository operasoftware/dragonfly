var cls = window.cls || ( window.cls = {} );

/**
 * @fileoverview
 * <strong>fixme: Deprecated. marked for removal</strong>
 */

/**
  * @constructor
  * @deprecated
  * use EventHandler and BaseActions
  */

window.cls.Helpers = function()
{
  var SELECTED_CLASS = "selected";

  this.setSelected = function(ele)
  {
    var container = ele.get_ancestor("container") || ele.parentNode;
    var selected = container.querySelector("." + SELECTED_CLASS);
    if (selected)
      selected.removeClass(SELECTED_CLASS);
    ele.addClass(SELECTED_CLASS);
  };

  /**
   * Return the filename of the script with `script_id`.
   */
  this.get_script_name = function(script_id)
  {
    var script = runtimes.getScript(script_id);
    var rt = script && runtimes.getRuntime(script.runtime_id);
    if (!script || !rt)
    {
      return null;
    }
    return script.uri || rt.uri;
  };

  /**
   * Returns the file name in a path. If there is no filename, it returns
   * the last directory. Query string and fragment identifier is stripped.
   *
   * E.g. "http://example.com/scripts/main.js" -> "main.js"
   *      "http://example.com/main.js?a=b#c"   -> "main.js"
   *      "http://example.com/scripts/"        -> "scripts"
   *
   * @param {String} path The path to shorten
   */
  this.basename = function(path)
  {
    const DATA_URI_MAX_SIZE = 40;

    if (!path)
    {
      return "";
    }

    if (path.startswith("data:"))
    {
      var short_path = path.slice(0, DATA_URI_MAX_SIZE);
      return path.length > DATA_URI_MAX_SIZE ? short_path + "…" : short_path;
    }

    // Strip away any query string or fragment identifier
    var end = path.indexOf("?");
    var hash_index = path.indexOf("#");
    if (hash_index != -1)
      end = Math.min(end, hash_index);

    if (end != -1)
      path = path.slice(0, end);

    // If there is no file name, show the last directory including slash
    var last = path.lastIndexOf("/") + 1;
    if (path.slice(-1) == "/")
    {
      last = path.slice(0, path.lastIndexOf("/")).lastIndexOf("/") + 1;
    }

    return path.slice(last);
  };

  this.shortenURI = function(uri)
  {
    var ret_uri = uri;
    var title = '';
    var max_length = 40;
    if( ret_uri && ret_uri.length > max_length )
    {
      title = uri;
      ret_uri = uri.split('?')[0];
      if( ret_uri.length > max_length )
      {
        var temp = /\/([^/]+)$/.exec(ret_uri);
        if( temp )
        {
          ret_uri = temp[1];
        }
      }
    }
    return {uri: ret_uri, title: title};
  }

  this.resolveURLS = function(top_url, url)
  {
    if (url.trim().startswith("data:"))
      return url;
    return (
        /^.{4,5}:\/\//.test(url) && url
        || /^\//.test(url) && /^.{4,5}:\/\/[^/]*/.exec(top_url)[0] + url
        || top_url.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/[^/]*$/, "/") + url );
  }

  this.escapeTextHtml = (function()
  {
    var re_amp = /&/g, re_lt = /</g;
    return function(str)
    {
      return str ? str.replace(re_amp, "&amp;").replace(re_lt, "&lt;") : str;
    }
  })();

  this.escapeAttributeHtml = (function()
  {
    var re_amp = /&/g, re_lt = /</g, re_quot = /"/g, re_s_quot = /'/g;
    return function(str)
    {
      return str.replace(re_amp, "&amp;")
                .replace(re_lt, "&lt;")
                .replace(re_quot, "&quot;")
                .replace(re_s_quot, "&#x27;");
    }
  })();

  /**
   * Escapes user input that is to be sent with Eval
   */
  this.escape_input = (function()
  {
    var replacement_map = [
      {
        regexp: /\\/g,
        replacement: "\\\\"
      },
      {
        regexp: /"/g,
        replacement: "\\\""
      },
      {
        regexp: /'/g,
        replacement: "\\'"
      },
      {
        regexp: /\n/g,
        replacement: "\\n"
      },
      {
        regexp: /\r/g,
        replacement: "\\r"
      },
      {
        regexp: /\u2028/g,
        replacement: "\\u2028"
      },
      {
        regexp: /\u2029/g,
        replacement: "\\u2029"
      }
    ];

    return function escape_input(str)
    {
      for (var i = 0, re; re = replacement_map[i]; i++)
      {
        str = str.replace(re.regexp, re.replacement);
      }
      return str;
    }
  })();

  this.escape_whitespace = (function()
  {
    var map = {
      "\t": "\\t",
      "\v": "\\v",
      "\f": "\\f",
      "\r": "\\r",
      "\n": "\\n"
    };

    return function escape_whitespace(string)
    {
      var ret = "";

      for (var i = 0, chr; chr = string[i]; i++)
      {
        ret += map[chr] || "\\u" + chr.charCodeAt(0).toString(16).zfill(4);
      }

      return ret;
    }
  })();

  this.unescape_whitespace = (function()
  {
    var re = /\\[tvfrn]|\\u[0-9A-fa-f]{4}/g;
    var map = {
      "\\t": "\t",
      "\\v": "\v",
      "\\f": "\f",
      "\\r": "\r",
      "\\n": "\n"
    };

    return function unescape_whitespace(string)
    {
      var match = null;
      var ret = "";

      while (match = re.exec(string))
      {
        ret += map[match[0]] || String.fromCharCode(parseInt(match[0].slice(2).toString(10), 16));
      }

      return ret;
    }
  })();

  this.setCookie = function(key, value, time)
  {
    document.cookie = (
      key + "=" + encodeURIComponent(value) +
      "; expires=" +
      ( new Date( new Date().getTime() + ( time || 360*24*60*60*1000 ) ) ).toGMTString() +
      "; path=/");
  }

  this.getCookie = function(key)
  {
    var value = new RegExp(key + "=([^;]*)").exec(document.cookie);
    return value && decodeURIComponent(value[1]);
  }

  // mouseover handler in the breadcrumb
  this.breadcrumbSpotlight = function(event)
  {
    var obj_id = parseInt(event.target.getAttribute('obj-id'));
    if(obj_id && /^breadcrumb$/i.test(event.target.parentNode.nodeName))
    {
      if (window.settings.dom.get('highlight-on-hover'))
        hostspotlighter.soft_spotlight(obj_id);
    }
  }
  // mouseover handler in the breadcrumb
  this.breadcrumbClearSpotlight = function(event)
  {
    var obj_id = event.target.getAttribute('obj-id');
    if( obj_id )
    {
      //hostspotlighter.clearSpotlight();
    }
  }

  this.service_dashed_name = function(name)
  {
    for ( var cur = '', i = 0, ret = ''; cur = name[i]; i++)
    {
      ret += /[A-Z]/.test(cur) && ( i ? '-' : '' ) + cur.toLowerCase() || cur;
    }
    return ret;
  }

  this.service_class_name = window.app && window.app.helpers.dash_to_class_name;

  this.scroll_dom_target_into_view = function()
  {
    var target = document.getElementById('target-element'), container = target;
    while (container && !/container/i.test(container.nodeName))
      container = container.parentElement;
    if (target && container)
    {
      container.scrollTop -= (
        container.getBoundingClientRect().top -
        target.getBoundingClientRect().top +
        Math.min(container.offsetHeight * .5, 100)
      );
      container.scrollLeft = 0;
    }
    return target && container;
  }

  this.copy_object = function(obj)
  {
    return JSON.parse(JSON.stringify(obj));
  };

  this.capitalize_first_char = function(str)
  {
    return str.replace(/(?:^| +)(.)/g, function(_char)
    {
      return _char.toUpperCase();
    });
  }

  if (!Array.isArray) {
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(o) == "[object Array]";
    };
  }

  this.pretty_print_number = function(num)
  {
    var numstring = String(num);
    var parts = numstring.split(".");
    var integral = parts[0].split("");
    var fractional = parts[1];
    var ret = "";

    while (integral.length > 3)
    {
      ret = "," + integral.splice(integral.length - 3, 3).join("") + ret;
    }

    if (integral.length)
    {
      ret = integral.join("") + ret;
    }

    if (fractional != null)
    {
      ret = ret + "." + fractional;
    }
    return ret;
  }

  /**
   * Aligns SVG lines to the pixel grid.
   */
  this.crispify_svg_value = function(value)
  {
    return Math.floor(value) + .5;
  };

  /**
   * Return a color in the preferred notation.
   *
   * @param {Color} color A color
   * @param {string} notation One of "hhex", "rgb" or "hsl"
   */
  this.get_color_in_notation = function(color, notation)
  {
    if (!color)
      return;

    if (color.alpha < 1)
    {
      notation = {
        "hhex": "rgba", // Fall back since hex cannot represent alpha
        "rgb": "rgba",
        "hsl": "hsla"
      }[notation] || "rgba";
    }

    return color[notation];
  };

  this.prop = (function()
  {
    var cache = {};
    return function(prop)
    {
      return cache[prop] || (cache[prop] = function(obj)
      {
        return obj[prop];
      });
    };
  })();

  this.eq = function(prop, val)
  {
    return function(obj)
    {
      return obj[prop] === val;
    };
  };
}

cls.Helpers.shortcut_search_cb = function(action_id, event, target)
{
  switch (action_id)
  {
    case 'highlight-next-match':
      this.highlight_next();
      return false;
    case 'highlight-previous-match':
      this.highlight_previous();
      return false;
  }
};
