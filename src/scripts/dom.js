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

Element.prototype.render = Document.prototype.render = function(args)
{
  var
  doc = this.nodeType == 9 ? this : this.ownerDocument,
  i = 0,
  ele = this,
  first_arg = args[0],
  arg = null,
  node_string_properties = ['innerHTML'];

  if (args.length)
  {
    if (first_arg)
    {
      if (typeof first_arg == 'string')
      {
        ele = first_arg in CustomElements ? CustomElements[first_arg].create() : doc.createElement(first_arg);
        i++;
      }
      arg = args[i];
      while (true)
      {
        if (arg instanceof Array)
        {
          ele.render(arg);
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
          throw "TemplateSyntaxError";
        }
        if (typeof args[i + 1] == 'string' && node_string_properties.indexOf(args[i]) == -1)
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

/**
 * Clear the element and render the template into it
 */
Element.prototype.clearAndRender = function(template)
{
  this.innerHTML = '';
  return this.render(template);
};

Element.prototype.renderInner = Document.prototype.renderInner = function callee(template)
{
  var
  i = 1,
  arg = template[i],
  tag_name = template[0],
  ret = "",
  content = [],
  attrs = ["<", tag_name, " "];

  if (tag_name)
  {
    while (true)
    {
      if (arg instanceof Array)
      {
        content.push(callee.call(null, arg));
        arg = template[++i];
      }
      else if (typeof arg == 'string' && ((template.length - i) % 2 || template[i + 1] instanceof Array))
      {
        content.push(arg.replace(/&/g, "&amp;").replace(/</g, "&lt;"));
        arg = template[++i];
      }
      else
      {
        break;
      }
    }
    content.push("</", tag_name, ">");
    for ( ; template[i]; i += 2)
    {
      attrs.push(template[i], "=\u0022", template[i + 1].replace(/"/g, "&quot"), "\u0022");
    }
    attrs.push(">");
    ret = attrs.join("") + content.join("");
    if (this && this.nodeType == 1)
    {
      this.innerHTML += ret;
    }
  }
  return ret;
};

/**
 * Add the css class "name" to the element's list of classes
 * fixme: Does not work with dashes in the name!
 */
Element.prototype.addClass = function(name)
{
  if (!(new RegExp('\\b' + name + '\\b')).test(this.className))
  {
    this.className = (this.className ? this.className + ' ' : '') + name;
  }
  return this;
};

/**
 * Remove the css class "name" from the elements list of classes
 */
Element.prototype.removeClass = function(name)
{
  var re = new RegExp(name + ' ?| ?' + name);
  if (re.test(this.className))
  {
    this.className = this.className.replace(re, '');
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
 * Returns the next sibling of the element that is an element. Ignores
 * nodes that are not elements
 */
Element.prototype.getNextSiblingElement = function()
{
  var next = this.nextSibling;
  while (next && next.nodeType != 1)
  {
    next = next.nextSibling;
  }
  return next;
};

// deprecated, use getBoundingClientRect instead
Element.prototype.getTop = function()
{
  var c = this, o_p = null, top = c.offsetTop;
  while (o_p = c.offsetParent)
  {
    top += o_p.offsetTop;
    c = o_p;
  }
  return top;
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
};

/**
 * Returns an array of all children on the element that are also elements
 */
Element.prototype.getChildElements = function()
{
  var children = this.childNodes, ret = [], c = null, i = 0;
  for ( ; c = children[i]; i++)
  {
    if (c.nodeType == 1)
    {
      ret[ret.length] = c;
    }
  }
  return ret;
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

/* currently broken in Opera */
Element.prototype.getWidth = function(e)
{
  var style = window.getComputedStyle(this, null);
  return this.offsetWidth
    - parseInt(style['paddingLeft'])
    - parseInt(style['paddingRight'])
    - parseInt(style['borderLeftWidth'])
    - parseInt(style['borderRightWidth']);
};

Element.prototype.spliceInnerHTML = function(str)
{
  this.insertAdjacentHTML('afterEnd', str);
  /*
  var
  temp = this.ownerDocument.createElement('div-parser'),
  range = this.ownerDocument.createRange();
  temp.innerHTML = str;
  if(this.nextSibling)
  {
    range.selectNodeContents(this.parentNode.insertBefore(temp, this.nextSibling));
  }
  else
  {
    range.selectNodeContents(this.parentNode.appendChild(temp));
  }
  this.parentNode.replaceChild(range.extractContents(), temp);
  */
};

/**
 * Get the first contained element with name nodeName
 */
Element.prototype.getFirst = function(nodeName)
{
  return this.getElementsByTagName(nodeName)[0];
};

/**
 * Get the last contained element with name nodeName
 */
Element.prototype.getLast = function(nodeName)
{
  var all = this.getElementsByTagName(nodeName);
  return all[all.length - 1];
};

/**
 * Get the previous element of the same name as "current" that is a
 * child of the element. Return null if there is no such element.
 */
Element.prototype.getPreviousSameNamed = function(current)
{
  var
  nodeName = current && current.nodeName,
  all = this.getElementsByTagName(nodeName),
  cur = null,
  i = 0;

  for ( ; (cur = all[i]) && cur != current; i++);
  return cur && all[i-1] || null;
};

/**
 * Same as getPreviousSameNamed but finds the next element
 */
Element.prototype.getNextSameNamed = function(current)
{
  var
  nodeName = current && current.nodeName,
  all = this.getElementsByTagName(nodeName),
  cur = null,
  i = 0;

  for ( ; (cur = all[i]) && cur != current; i++);
  return cur && all[i+1] || null;
};

/**
 * Get the next element of the same name as "target" that is a
 * sibling of the element. Return null if there is no such element.
 */
Element.prototype.getNextSameNamedSibling = function(target)
{
  var
  next = this.nextSibling,
  name = this.nodeName;

  while (next && next.nodeName != name)
  {
    next = next.nextSibling;
  }

  return next;
};

/**
 * Same as getNextSameNamedSibling but finds previous sibling
 */
Element.prototype.getPreviousSameNamedSibling = function(target)
{
  var
  previous = this.previousSibling,
  name = this.nodeName;

  while (previous && previous.nodeName != name)
  {
    previous = previous.previousSibling;
  }

  return previous;
};

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
 * Get the value of an attribute called attr from the first child node called
 * nodeName. If node is not found, returns null
 * @argument nodeName {string} node name
 * @argument attr {string} attribute name
 * @returns {string}
 */
Node.prototype.getAttributeFromNode = function(nodeName, attr)
{
  var node = this.getElementsByTagName(nodeName)[0];
  if (node)
  {
    return node.getAttribute(attr);
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

/**
 * Make sure there is a getElementsByClassName method if there is no native
 * implementation of it
 * @deprecated All verison of opera in which the dragonfly client runs should have this by now
 */
(function() {
  if (!document.getElementsByClassName)
  {
    Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName = function()
    {
      var eles = this.getElementsByTagName("*"),
          ele = null, ret =[], c_n = '', cursor = null, i = 0, j = 0;
      for ( ; c_n = arguments[i]; i++)
      {
        arguments[i] = new RegExp('(?:^| +)' + c_n + '(?: +|$)');
      }
      for (i = 0; ele = eles[i]; i++)
      {
        c_n = ele.className;
        for (j = 0; (cursor = arguments[j]) && cursor.test(c_n); j++);
        if (!cursor)
        {
          ret[ret.length] = ele;
        }
      }
      return ret;
    }
  }
})();

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
  this.adjust_height = function()
  {
    if (this.scrollHeight != this.offsetHeight)
    {
      // TODO values should not be hardcoded
      this.style.height = (4 + (this.scrollHeight > 16 ? this.scrollHeight : 16)) + 'px';
    }
  };

  this._get_adjust_height = function(count_lines, line_height, border_padding)
  {
    var lines = -1;
    return function()
    {
      var new_count = count_lines(this.value);
      if (new_count != lines)
      {
        lines = new_count;
        this.style.height = (border_padding + (lines) * line_height) + 'px';
      }
    }
  }

  this._count_lines = (function(re)
  {
    return function(str)
    {
      for (var count = 1; re.exec(str); count++);
      return count;
    };
  })(/\r\n/g);

  this._get_line_height = function(textarea)
  {
    // computed style returns by default just "normal"
    var
    CRLF = "\r\n",
    offset_height = textarea.offsetHeight,
    textarea_value = textarea._get_value(),
    line_height = 0,
    test_value = "\r\n\r\n\r\n\r\n\r\n\r\n";

    textarea.value = test_value;
    while (textarea.scrollHeight < offset_height)
    {
      textarea.value = (test_value += CRLF);
    }
    line_height = textarea.scrollHeight;
    textarea.value = (test_value += CRLF);
    line_height = textarea.scrollHeight - line_height;
    textarea.value = textarea_value;
    return line_height;
  };

  this._get_border_padding = function(ele)
  {
    var
    border_padding = 0,
    style_dec = window.getComputedStyle(ele, null);

    if (style_dec.getPropertyValue('box-sizing') == 'border-box')
    {
      ['padding-top', 'padding-bottom', 'border-top', 'border-bottom'].forEach(function(prop)
      {
        border_padding += parseInt(style_dec.getPropertyValue(prop)) || 0;
      })
    };
    return border_padding;
  };

  (this._inits || (this._inits = [])).push(function(ele)
  {
    var adjust_height = this._get_adjust_height(this._count_lines,
        this._get_line_height(ele), this._get_border_padding(ele));
    adjust_height.call(ele);
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
'PlaceholderFeature',
'AutoScrollHeightFeature');

