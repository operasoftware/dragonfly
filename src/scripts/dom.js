if (!window.opera)
{
  window.opera =
  {
    postError: function(a){console.log(a);},
    stpVersion: true
  };
}
/*
(function()
{
  var div = document.createElement('div')
  var setter = div.__lookupSetter__("scrollTop");
  var getter = div.__lookupGetter__("scrollTop");
  Element.prototype.__defineSetter__('scrollTop', function(scroll_top)
  {
    opera.postError('setter: '+this.nodeName + ', '+scroll_top);
    setter.call(this, scroll_top);
  });
  Element.prototype.__defineGetter__('scrollTop', function()
  {
    var scroll_top = getter.call(this);
    return scroll_top;
  });
})();
*/

/* testing in Chrome or FF
if (document.createElementNS &&
    document.createElement('div').namespaceURI != 'http://www.w3.org/1999/xhtml')
{
  Document.prototype.createElement = document.createElement = function(name)
  {
    return this.createElementNS('http://www.w3.org/1999/xhtml', name);
  };
}
*/

if (!Element.prototype.contains)
{
  Element.prototype.contains = function(ele)
  {
    while (ele && ele != this)
      ele = ele.parentNode;
    return Boolean(ele);
  }
}

if (!Element.prototype.insertAdjacentHTML)
{
  Element.prototype.insertAdjacentHTML = function(position, markup)
  {
    if (position == 'beforeend')
    {
      var div = this.appendChild(document.createElement('div'));
      div.innerHTML = markup;
      var range = document.createRange();
      range.selectNodeContents(div);
      this.replaceChild(range.extractContents(), div);
      return this.firstElementChild;
    }
  }
}

if (typeof document.createElement('div').classList == 'undefined')
{
  Element.prototype.__defineGetter__('classList', function()
  {
    return this.className.split(/\s+/);
  });
  Element.prototype.__defineSetter__('classList', function(){});
}

/**
 * @fileoverview
 * Helper function prototypes related to DOM objects and the DOM
 * <strong>fixme: Christian should document the template syntax</strong>
 *
 * TEMPLATE :: =
 *     "[" [NODENAME | "null"]
 *         {"," TEXT | "," TEMPLATE}
 *         {"," KEY "," VALUE}
 *      "]"
 *
 * where NODENAME, TEXT and KEY are DOM strings and VALUE can be everything except an array
 */

Element.prototype.render = Document.prototype.render = function(args, namespace)
{
  var args_is_string = typeof args == 'string';
  if (this.nodeType == 1 && args_is_string ||
      (args.length == 1 && typeof args[0]  == 'string' && /</.test(args[0])))
  {
    this.insertAdjacentHTML('beforeend', args_is_string ? args : args[0]);
    return this.firstElementChild;
  }

  var
  doc = this.nodeType == 9 ? this : this.ownerDocument,
  i = 0,
  ele = this,
  first_arg = args[0],
  arg = null,
  prefix_pos = -1;

  if (args.length)
  {
    if (first_arg)
    {
      if (typeof first_arg == 'string')
      {
        if ((prefix_pos = first_arg.indexOf(':')) != -1)
        {
          namespace = doc.lookupNamespaceURI(first_arg.slice(0, prefix_pos));
          if (!namespace)
          {
            throw('namespace not defined in call Node.prototype.___add')
          }
          ele = doc.createElementNS(namespace, first_arg.slice(prefix_pos + 1));
        }
        else if (namespace)
          ele = doc.createElementNS(namespace, first_arg.slice(prefix_pos + 1));
        else
        {
          ele = first_arg in CustomElements ? CustomElements[first_arg].create() : doc.createElement(first_arg);
        }
        i++;
      }
      arg = args[i];
      while (true)
      {
        if (arg instanceof Array)
        {
          ele.render(arg, namespace);
          arg = args[++i];
        }
        else if (typeof arg == 'string' && ((args.length - i) % 2 || args[i + 1] instanceof Array))
        {
          ele.appendChild(doc.createTextNode(arg));
          arg = args[++i];
        }
        else
        {
          break;
        }
      }
      for ( ; args[i]; i += 2)
      {
        if (typeof args[i] != 'string')
        {
          throw "TemplateSyntaxError, expected 'string', got " +
                (typeof args[i]) + " for TEXT or KEY";
        }
        if (typeof args[i + 1] == 'string')
        {
          ele.setAttribute(args[i], args[i + 1]);
        }
        else
        {
          ele[args[i]] = args[i + 1];
        }
      }
      if (this.nodeType == 1 && (this != ele))
      {
        this.appendChild(ele);
      }
      return ele;
    }
    else
    {
      return this.appendChild(doc.createTextNode(args[1]));
    }
  }
  return null;
};

Element.prototype.re_render = function(args)
{
  var parent = this.parentNode, ret = [];
  if (parent)
  {
    var div = document.createElement('div');
    var doc_frag = document.createDocumentFragment();
    div.render(args);
    while (div.firstChild)
    {
      ret.push(doc_frag.appendChild(div.firstChild));
    }
    parent.replaceChild(doc_frag, this);
    return ret;
  }
  return null;
}

/**
 * Clear the element and render the template into it
 */
Element.prototype.clearAndRender = function(template)
{
  this.innerHTML = '';
  return this.render(template);
};

/**
 * Add the css class "name" to the element's list of classes
 * fixme: Does not work with dashes in the name!
 * Note: Uses get/setAttribute instead of .className so it will
 * work on both html and svg elements
 */
Element.prototype.addClass = function(name)
{
  var c = this.getAttribute("class");
  if (!(new RegExp('\\b' + name + '\\b')).test(c))
  {
    this.setAttribute("class", (c ? c + ' ' : '') + name);
  }
  return this;
};

/**
 * Remove the css class "name" from the elements list of classes
 * Note: Uses get/setAttribute instead of .className so it will
 * work on both html and svg elements
 */
Element.prototype.removeClass = function(name)
{
  var c = this.getAttribute("class");
  var re = new RegExp(name + ' ?| ?' + name);
  if (re.test(c))
  {
    this.setAttribute("class", c.replace(re, ''));
  }
  return this;
};

/**
 * Check if the element has the class "name" set
 */
Element.prototype.hasClass = function(name)
{
  return (new RegExp('(?:^| +)' + name + '(?: +|$)')).test(this.className)
};

/**
 * Swap class "from" with class "to"
 */
Element.prototype.swapClass = function(from, to)
{
  if (this.hasClass(from))
  {
    this.removeClass(from);
    this.addClass(to);
  }
};

/**
 * Insert node after target in the tree.
 */
Element.prototype.insertAfter = function(node, target)
{
  var nextElement = target.nextSibling;
  while (nextElement && nextElement.nodeType != 1)
  {
    nextElement = nextElement.nextSibling;
  }
  if (nextElement)
  {
    this.insertBefore(node, nextElement);
  }
  else
  {
    this.appendChild(node);
  }
  return node;
};

/**
 * Dispatches an event on the element with the name "name" and and properties
 * that are set in the "custom_props" object
 */
Element.prototype.releaseEvent = function(name, custom_props)
{
  var event = document.createEvent('Events'), prop = '';
  event.initEvent(name, true, true);
  if (custom_props)
  {
    for (prop in custom_props)
    {
      event[prop] = custom_props[prop];
    }
  }
  this.dispatchEvent(event);
};

Element.prototype.dispatchMouseEvent = function(type, ctrl_key, alt_key, shift_key)
{
  var event = document.createEvent('MouseEvents');
  var box = this.getBoundingClientRect();
  var client_x = box.left + box.width * .5;
  var client_y = box.top + box.height * .5;
  event.initMouseEvent(type, true, true, window, 1,
                       window.screenLeft + client_x,
                       window.screenTop + client_y,
                       client_x, client_y,
                       ctrl_key, alt_key, shift_key, false,
                       0, null);
  this.dispatchEvent(event);
};

Element.prototype.get_scroll_container = function()
{
  var scroll_container = this;
  while (scroll_container &&
         scroll_container.scrollHeight <= scroll_container.offsetHeight)
    scroll_container = scroll_container.parentNode;
  return (scroll_container == document.documentElement ||
          scroll_container == document) ? null : scroll_container;
}
/**
  * A class to store a scroll position and reset it later in an asynchronous
  * environment.
  * The class takes a target as initialisation argument.
  * The scroll position is stored for the first scroll container
  * in the parent node chain of that target. The root element is
  * disregarded as scroll container (this is a bit too Dragonfly specific.
  * Better would be to check the overflow property of the computed style to
  * find a real scroll container).
  * Resetting the scroll position can be done with or without argument.
  * Without argument. it resets the scrollTop and scrollLeft properties
  * of the scroll container to the stored values. With a target argument,
  * it scroll the target in the exact same position as the target of
  * the initialisation.
  */
Element.ScrollPosition = function(target)
{
  this._scroll_container = target.get_scroll_container();
  this._scroll_top = 0;
  this._scroll_left = 0;
  this._delta_top = 0;
  this._delta_left = 0;
  if (this._scroll_container)
  {
    this._scroll_top = this._scroll_container.scrollTop;
    this._scroll_left = this._scroll_container.scrollLeft;
    var target_box = target.getBoundingClientRect();
    var scroll_box = this._scroll_container.getBoundingClientRect();
    this._container_top = scroll_box.top;
    this._container_left = scroll_box.left;
    this._delta_top = target_box.top - scroll_box.top;
    this._delta_left = target_box.left - scroll_box.left;
  }

}

/**
  * To reset the scroll position.
  * Without target, scrollTop and scrollleft are restored to
  * the initialisation values.
  * If target is set, the target is scrolled in the exact same position
  * as the target of the initialisation.
  * A secondary container can be specified. This will be used in case the
  * initial scroll container was not set in get_scroll_container().
  */
Element.ScrollPosition.prototype.reset = function(target, sec_container)
{
  if (this._scroll_container)
  {
    if (target)
    {
      var target_box = target.getBoundingClientRect();
      this._scroll_container.scrollTop -= this._delta_top -
                                          (target_box.top - this._container_top);
      this._scroll_container.scrollTop -= this._delta_left -
                                          (target_box.left - this._container_left);
    }
    else
    {
      this._scroll_container.scrollTop = this._scroll_top;
      this._scroll_container.scrollLeft = this._scroll_left;
    }
  }
  else if (sec_container)
  {
    var scroll_container = sec_container.get_scroll_container();
    if (scroll_container)
    {
      scroll_container.scrollTop = 0;
      scroll_container.scrollLeft = 0;
    }
  }
}

/**
 * Returns the next element for which the function "filter" returns true.
 * The filter functions is passed two arguments, the current candidate element
 * and the element on which the method was called
 */
Element.prototype.getNextWithFilter = function(root_context, filter)
{
  var cursor = this;
  while ((cursor = cursor.getNextInFlow(root_context)) && !filter(cursor, this));
  return cursor;
};

/**
 * Same as getNextWithFilter but finds previous element
 */
Element.prototype.getPreviousWithFilter = function(root_context, filter)
{
  var cursor = this;
  while ((cursor = cursor.getPreviousInFlow(root_context)) && !filter(cursor, this));
  return cursor;
};

Element.prototype.getNextInFlow = function(root_context)
{
  var
  next = this.firstElementChild || this.nextElementSibling,
  cursor = this;

  while (!next && (cursor = cursor.parentNode) && cursor != root_context)
  {
    next = cursor.nextElementSibling;
  }
  return next;
};

Element.prototype.getPreviousInFlow = function(root_context)
{
  var
  previous = this.previousElementSibling,
  parent = this.parentNode,
  cursor = previous;

  while (cursor && cursor.lastElementChild && (cursor = cursor.lastElementChild));
  return cursor || previous || parent != root_context && parent || null;
};


/* Check elements of a DOM traversal for an attribute. */
Element.prototype.has_attr = function(traverse_type, name)
{
  switch (traverse_type)
  {
    case "parent-node-chain":
    {
      var ele = this;
      while (ele && ele.nodeType == 1 && !ele.hasAttribute(name))
        ele = ele.parentNode;
      return ele && ele.nodeType == 1 && ele || null;
      break;
    }
  }
  return null;
};

/* Get an attribute of the first hit of a DOM traversal. */
Element.prototype.get_attr = function(traverse_type, name)
{
  switch (traverse_type)
  {
    case "parent-node-chain":
    {
      var ele = this;
      while (ele && ele.nodeType == 1 && !ele.hasAttribute(name))
        ele = ele.parentNode;
      return ele && ele.nodeType == 1 && ele.hasAttribute(name) ? ele.getAttribute(name) : null;
      break;
    }
  }
  return null;
};

if (!Element.prototype.matchesSelector)
{
  Element.prototype.matchesSelector =
    Element.prototype.oMatchesSelector ?
    Element.prototype.oMatchesSelector :
    function(selector)
    {
      var sel = this.parentNode.querySelectorAll(selector);
      for (var i = 0; sel[i] && sel[i] != this; i++);
      return Boolean(sel[i]);
    }
};

/* The naming is not precise, it can return the element itself. */

Element.prototype.get_ancestor = function(selector)
{
  var ele = this;
  while (ele)
  {
    if (ele.nodeType == 1 && ele.matchesSelector(selector))
    {
      return ele;
    }
    ele = ele.parentNode;
  }
  return null;
};

/**
 * Make sure the element is visible in its scoll context.
 * @see Element.prototype.scrollSoftIntoContainerView
 */
Element.prototype.scrollSoftIntoView = function()
{
  // just checking the first offsetParent to keep it simple
  var scrollContainer = this.offsetParent;
  var min_top = 20;
  if (scrollContainer && scrollContainer.offsetHeight < scrollContainer.scrollHeight)
  {
    if (this.offsetTop < scrollContainer.scrollTop + min_top)
    {
      scrollContainer.scrollTop = this.offsetTop - min_top;
    }
    else if (this.offsetTop + this.offsetHeight > scrollContainer.scrollTop + scrollContainer.offsetHeight - min_top)
    {
      scrollContainer.scrollTop =
        this.offsetTop + this.offsetHeight - scrollContainer.offsetHeight + min_top;
    }
  }
};

/**
 * Make sure the element is visible in the container. The container is the
 * first <container> element found in the offsetParent chain, or body if no
 * container element is found.
 */
Element.prototype.scrollSoftIntoContainerView = function()
{
  var scrollContainer = this.offsetParent;
  while (scrollContainer && scrollContainer != document.body &&
         scrollContainer.nodeName.toLowerCase() != "container")
  {
    scrollContainer = scrollContainer.offsetParent;
  }

  var min_top = 20;
  if (scrollContainer && scrollContainer.offsetHeight < scrollContainer.scrollHeight)
  {
    if (this.offsetTop < scrollContainer.scrollTop + min_top)
    {
      scrollContainer.scrollTop = this.offsetTop - min_top;
    }
    else if (this.offsetTop + this.offsetHeight > scrollContainer.scrollTop + scrollContainer.offsetHeight - min_top)
    {
      scrollContainer.scrollTop =
        this.offsetTop + this.offsetHeight - scrollContainer.offsetHeight + min_top;
    }
  }
};

Element.prototype.hasTextNodeChild = function()
{
  for (var i = 0, child; child = this.childNodes[i]; i++)
  {
    if (child.nodeType == document.TEXT_NODE)
    {
      return true;
    }
  }
  return false;
}

/**
 * Get the text content of the first node in Node with the name nodeName
 * Escapes opening angle brackets into less than entities. If node is not
 * found, returns null
 * @argument nodeName {string} node name
 * @returns {Element}
 */
Node.prototype.getNodeData = function(nodeName)
{
  var node = this.getElementsByTagName(nodeName)[0];
  if (node)
  {
    return node.textContent.replace(/</g, '&lt;');
  }
  return null;
};

/**
 * Returns the index of item in the nodelist
 * (The same behaviour as js1.6 array.indexOf)
 * @argument item {Element}
 */
NodeList.prototype.indexOf = function(item)
{
  for (var cursor = null, i = 0; cursor = this[i]; i++)
  {
    if (cursor == item)
    {
      return i;
    }
  }
  return -1;
};

/**
 * Return the sum of all the values in the array. If selectorfun is given,
 * it will be called to retrieve the relevant value for each item in the
 * array.
 */
Array.prototype.sum = function(selectorfun)
{
  if (selectorfun)
  {
    return this.map(selectorfun).sum();
  }
  else
  {
    var ret = 0;
    this.forEach(function(e) { ret += e });
    return ret
  }
};

Array.prototype.unique = function()
{
  var ret = [];
  this.forEach(function(e) { if (ret.indexOf(e) == -1) {ret.push(e) }});
  return ret;
}

Array.prototype.__defineGetter__("last", function()
{
   return this[this.length - 1];
});

Array.prototype.__defineSetter__("last", function() {});

Array.prototype.extend = function(list)
{
  this.push.apply(this, list);
  return this;
};

Array.prototype.insert = function(index, list, replace_count)
{
  this.splice.apply(this, [index, replace_count || 0].extend(list));
  return this;
};


StyleSheetList.prototype.getDeclaration = function(selector)
{
  var sheet = null, i = 0, j = 0, rules = null, rule = null;
  for ( ; sheet = this[i]; i++)
  {
    rules = sheet.cssRules;
    // does not take into account import rules
    for (j = 0; (rule = rules[j]) && !(rule.type == 1 && rule.selectorText == selector); j++);
    if (rule)
    {
      return rule.style;
    }
  }
  return null;
};

StyleSheetList.prototype.getPropertyValue = function(selector, property)
{
  var style = this.getDeclaration(selector);
  return style && style.getPropertyValue(property) || '';
};

if (!(function(){}).bind)
{
  Function.prototype.bind = function (context)
  {
    var method = this, args = Array.prototype.slice.call(arguments, 1);
    return function()
    {
      return method.apply(context, args.concat(Array.prototype.slice.call(arguments)));
    }
  };
};

if (!"".trim)
{
  String.prototype.trim = function()
  {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }
}

/**
 * Check if a string appears to be a number, that is, all letters in the
 * string are numbers. Does not take in to account decimals. Clones the
 * behaviour of str.isdigit in python
 */
String.prototype.isdigit = function()
{
  return this.length && !(/\D/.test(this));
};

Array.prototype.contains = String.prototype.contains = function(str)
{
  return this.indexOf(str) != -1;
};

String.prototype.startswith = function(str)
{
  return this.slice(0, str.length) === str;
};

String.prototype.endswith = function(str)
{
  return this.slice(this.length - str.length) === str;
};

String.prototype.zfill = function(width)
{
  return this.replace(/(^[+-]?)(.+)/, function(str, sign, rest) {
    var fill = Array(Math.max(width - str.length + 1, 0)).join(0);
    return sign + fill + rest;
  });
};

String.prototype.ljust = function(width, char)
{
  return this + Array(Math.max(width - this.length + 1, 0)).join(char || ' ');
};

/**
 * Capitalizes the first character of the string. Lowercases the rest of
 * the characters, unless `only_first` is true.
 */
String.prototype.capitalize = function(only_first)
{
  var rest = this.slice(1);
  if (!only_first)
  {
    rest = rest.toLowerCase();
  }
  return this[0].toUpperCase() + rest;
};



/**
 * Local ISO strings, currently needed as datetime-local input values
 * http://dev.w3.org/html5/markup/input.datetime-local.html#input.datetime-local.attrs.value
 */
Date.prototype.toLocaleISOString = function()
{
 return new Date(this.getTime() - this.getTimezoneOffset() * 1000 * 60).toISOString().replace('Z','');
};

/**
 * Convenience function for loading a resource with XHR using the get method.
 * Will automatically append a "time" guery argument to avoid caching.
 * When the load is finished, callback will be invoced with context as its
 * "this" value
 */

XMLHttpRequest.prototype.loadResource = function(url, callback, context)
{
  this.onload = function()
  {
    callback(this, context);
  }
  this.open('GET', url);
  this.send(null);
};

window.CustomElements = new function()
{
  this._init_queue = [];

  this._init_listener = function(event)
  {
    var
    queue = CustomElements._init_queue,
    wait_list = [],
    item = null,
    i = 0,
    target = event.target;

    for ( ; item = queue[i]; i++)
    {
      if (target.contains(item.ele))
      {
        CustomElements[item.type].init(item.ele);
      }
      else
      {
        wait_list.push(item);
      }
    }
    CustomElements._init_queue = wait_list;
    if (!wait_list.length)
    {
      document.removeEventListener('DOMNodeInserted', CustomElements._init_listener, false);
    }
  }

  this.add = function(CustomElementClass)
  {
    CustomElementClass.prototype = this.Base;
    var custom_element = new CustomElementClass(), feature = '', i = 1;
    if (custom_element.type)
    {
      for ( ; feature = arguments[i]; i++)
      {
        if (feature in this)
        {
          this[feature].apply(custom_element);
        }
      }
      this[custom_element.type] = custom_element;
    }
  }
};

window.CustomElements.Base = new function()
{
  this.create = function()
  {
    var ele = document.createElement(this.html_name);
    if (!CustomElements._init_queue.length)
    {
      document.addEventListener('DOMNodeInserted', CustomElements._init_listener, false);
    }

    CustomElements._init_queue.push(
    {
      ele: ele,
      type: this.type
    });

    return ele;
  }

  this.init = function(ele)
  {
    if (this._inits)
    {
      for (var init = null, i = 0; init = this._inits[i]; i++)
      {
        init.call(this, ele);
      }
    }
  }
};

window.CustomElements.PlaceholderFeature = function()
{
  this.set_placeholder = function()
  {
    var placeholder = this.getAttribute('data-placeholder');
    if (!this.value && placeholder)
    {
      this.value = placeholder;
      this.addClass('placeholder');
    }
  }

  this.clear_placeholder = function()
  {
    if (this.hasClass('placeholder'))
    {
      this.removeClass('placeholder');
      this.value = '';
    }
  }

  this.get_value = function()
  {
    return this.hasClass('placeholder') ? '' : this._get_value();
  };

  (this._inits || (this._inits = [])).push(function(ele)
  {
    if (!ele._get_value)
    {
      var _interface = ele.toString().slice(8).replace(']', '');
      window[_interface].prototype._get_value = ele.__lookupGetter__('value');
      window[_interface].prototype._set_value = ele.__lookupSetter__('value');
    }
    ele.__defineSetter__('value', ele._set_value);
    ele.__defineGetter__('value', this.get_value);
    this.set_placeholder.call(ele);
    ele.addEventListener('focus', this.clear_placeholder, false);
    ele.addEventListener('blur', this.set_placeholder, false);
  });
};

window.CustomElements.AutoScrollHeightFeature = function()
{
  this._adjust_height = function(delta, event)
  {
    if (!this.value)
    {
      this.style.height = "auto";
      this.rows = 1;
    }
    else
    {
      this.rows = 0;
      this.style.height = "0";
      this.style.height = this.scrollHeight + delta + "px";
    }
  };

  this._get_delta = function(ele)
  {
    var style = window.getComputedStyle(ele, null);
    var is_border_box = style.getPropertyValue("box-sizing") == "border-box";
    var prop = is_border_box ? "border" : "padding";
    var sign = is_border_box ? 1 : -1;

    return (sign * parseInt(style.getPropertyValue(prop + "-bottom")) || 0) +
           (sign * parseInt(style.getPropertyValue(prop + "-top")) || 0);
  };

  (this._inits || (this._inits = [])).push(function(ele)
  {
    var delta = this._get_delta(ele);
    var adjust_height = this._adjust_height.bind(ele, delta);
    adjust_height();
    ele.addEventListener('input', adjust_height, false);
  });

};

CustomElements.add(function()
{
  this.type = '_html5_input';
  this.html_name = 'input';
},
'PlaceholderFeature');

CustomElements.add(function()
{
  this.type = '_html5_textarea';
  this.html_name = 'textarea';
},
'PlaceholderFeature');

CustomElements.add(function()
{
  this.type = '_auto_height_textarea';
  this.html_name = 'textarea';
},
'AutoScrollHeightFeature');


