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

  this.setSelected = function(ele)
  {
    var parent = ele.parentNode;
    var siblings = parent.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if( sibling.parentElement == parent )
      {
        if(sibling == ele) 
        {
          sibling.addClass('selected'); 
        }
        else
        {
          sibling.removeClass('selected'); 
        }
      }
    }
  }

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
    if (!path)
    {
      return "";
    }
    // Strip away any query string or fragment identifier
    var end = Math.min(path.indexOf("?"), path.indexOf("#"));
    if (end != -1)
    {
      path = path.slice(0, end);
    }

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
      return str.replace(re_amp, "&amp;").replace(re_lt, "&lt;");
    }
  })();

  this.escapeAttributeHtml = (function()
  {
    var re_amp = /&/g, re_lt = /</g, re_quot = /"/g;
    return function(str)
    {
      return str.replace(re_amp, "&amp;").replace(re_lt, "&lt;").replace(re_quot, "&quot;");
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

  this.copy_array = function copy_array(item)
  {
    if (Array.isArray(item))
    {
      return item.map(copy_array);
    }
    else
    {
      return item;
    }
  };

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
      ret = "," + integral.splice(integral.length-3, 3).join("") + ret;
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
  this.crispifySvgValue = function(value)
  {
    return Math.floor(value) + .5;
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
