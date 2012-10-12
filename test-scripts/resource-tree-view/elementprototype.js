"use strict";

Element.prototype.append_tmpl = function(tmpl)
{
  var ELE_NAME = 0;
  var ATTRS = 1;
  var ele = null;
  var i = 0;
  if (typeof tmpl[ELE_NAME] == "string")
  {
    i++;
    ele = document.createElement(tmpl[ELE_NAME]);
    if (Object.prototype.toString.call(tmpl[ATTRS]) == "[object Object]")
    {
      i++;
      var attrs = tmpl[ATTRS];
      if (attrs)
      {
        for (var prop in attrs)
        {
          if (typeof attrs[prop] == "string")
            ele.setAttribute(prop, attrs[prop]);
        }
      }
    }
  }
  for (; i < tmpl.length; i++)
  {
    if (typeof tmpl[i] == "string")
      ele.appendChild(document.createTextNode(tmpl[i]))
    else
      (ele || this).append_tmpl(tmpl[i]);
  }
  if (ele)
    this.appendChild(ele);
};

Element.prototype.replace_with_tmpl = function(tmpl)
{
  var parent = this.parentNode, ret = [];
  if (parent)
  {
    var div = document.createElement('div');
    var doc_frag = document.createDocumentFragment();
    div.append_tmpl(tmpl);
    while (div.firstChild)
    {
      ret.push(doc_frag.appendChild(div.firstChild));
    }
    parent.replaceChild(doc_frag, this);
    return ret;
  }
  return null;
}

Element.prototype.get_ancestor = function(selector)
{
  var ele = this;
  while (ele)
  {
    if (ele.matchesSelector(selector))
      return ele;

    ele = ele.parentElement;
  }
  return null;
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
                       Boolean(ctrl_key), Boolean(alt_key), Boolean(shift_key), false,
                       0, null);
  this.dispatchEvent(event);
};

if (!document.createElement("div").dataset)
{
  Element.prototype.__defineGetter__("dataset", function()
  {
    return Array.prototype.reduce.call(this.attributes, function(dict, attr)
    {
      if (attr.name.indexOf("data-") == 0)
        dict[attr.name.slice(5)] = attr.value;

      return dict;
    }, {});
  });
}

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
}


