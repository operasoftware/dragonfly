var TooltipManager = function() {};

(function()
{
  /* static methods of TooltipManager */

  this.register = function(name, keep_on_hover) {};
  this.unregister = function(name, tooltip) {};

  var Tooltip = function() {};

  Tooltip.prototype = new function()
  {
    /* interface */

    /**
      * Called if a node in the current mouseover parent node chaine of the
      * event target has a 'data-tooltip' value with the same name as this instance.
      * To show the tooltip the 'show' method must be called, mainly to
      * prevent that the tooltip is shown before it has content.
      */
    this.ontooltip = function(event, target){};
    
    /**
      * Called if the tooltip gets hidden.
      */
    this.onhide = function(){};

    /**
      * To show the tooltip.
      * By default the tooltip is positioned in relation to the element
      * with the data-tooltip attribute. If the method is called with
      * the optional 'box' argument that box is used instead to position
      * the tooltip.
      * @param content {String or Template} The content for the tooltip. Optional.
      * If not set the 'data-tooltip-text' value on the target element will be 
      * used instead.
      * @param box The box to position the tootip. Optional. Only left, top and 
      * bottom are used. By default the box is given by the intersection of the 
      * vertical line given by the mouse event left postion and the dimension
      * and position of the target element.
      */
    this.show = function(content, box){};

    /**
      * To hide the tooltip.
      */
    this.hide = function(){};
    
    /* implementation */
    
    this.show = function(content, box)
    {
      _show_tooltip(this, content, box);
    };

    this.hide = function()
    {
      _hide_tooltip(this);
    };
  };



  /* constants */

  const DATA_TOOLTIP = "data-tooltip";
  const DATA_TOOLTIP_TEXT = "data-tooltip-text";
  const HIDE_DELAY = 120;
  const SHOW_DELAY = 110;
  const DISTANCE_X = 7;
  const DISTANCE_Y = 7;

  /* private */

  var _tooltips = {};
  var _is_setup = false;
  var _tooltip_ele = null;
  var _current_tooltip = null;
  var _last_handler_ele = null;
  var _last_event = null;
  var _hide_timeouts = [];
  var _show_timeouts = [];

  var _mouseover = function(event)
  {
    var ele = event.target;
    while (ele && ele.nodeType == document.ELEMENT_NODE)
    {
      if (ele == _tooltip_ele)
      {
        if (_current_tooltip && _current_tooltip._keep_on_hover)
        {
          _last_handler_ele = null;
          _clear_show_timeout();
          _clear_hide_timeout();
        }
        else
        {
          _set_hide_timeout();
        }
        return;
      }
      
      var name = ele.getAttribute(DATA_TOOLTIP);
      if (name && _tooltips[name] && ele != _last_handler_ele) 
      {
        if (_current_tooltip != _tooltips[name])
        {
          _current_tooltip = _tooltips[name];
          _tooltip_ele.innerHTML = "";
          _tooltip_ele.appendChild(_current_tooltip._container);
        }
        _last_handler_ele = ele;
        _last_event = event;
        _set_show_timeout();
        return;
      }

      ele = ele.parentNode;
    }

    _set_hide_timeout();
  };

  var _set_hide_timeout = function()
  {
    _clear_hide_timeout();
    _hide_timeouts.push(setTimeout(_handle_hide_tooltip, HIDE_DELAY));
  };

  var _clear_hide_timeout = function()
  {
    while(_hide_timeouts.length)
      clearTimeout(_hide_timeouts.pop());
  };

  var _set_show_timeout = function()
  {
    _clear_hide_timeout();
    _clear_show_timeout();
    _show_timeouts.push(setTimeout(_handle_show_tooltip, SHOW_DELAY));
  };

  var _clear_show_timeout = function()
  {
    while(_show_timeouts.length)
      clearTimeout(_show_timeouts.pop());
  };

  var _handle_show_tooltip = function(event, ele, name)
  {
    if (_last_event && _last_handler_ele)
      _current_tooltip.ontooltip(_last_event, _last_handler_ele);
  };

  var _handle_hide_tooltip = function()
  {
    _clear_show_timeout();
    if (_current_tooltip)
      _current_tooltip.onhide();

    _tooltip_ele.innerHTML = "";
    _tooltip_ele.style.cssText = "";
    _current_tooltip = null;
    _last_handler_ele = null;
  };

  var _show_tooltip = function(tooltip, content, box)
  {
    if (tooltip == _current_tooltip)
    {
      if (!content && _last_handler_ele)
        content = _last_handler_ele.getAttribute(DATA_TOOLTIP_TEXT);

      if (content)
      {
        if (typeof content == "string")
          _current_tooltip._container.textContent = content;
        else
          _current_tooltip._container.render(content);
      }

      if (!box && _last_handler_ele)
      {
        var handler_ele_box = _last_handler_ele.getBoundingClientRect();
        box = {top: handler_ele_box.top,
               bottom: handler_ele_box.bottom,
               left: _last_event ? _last_event.clientX : handler_ele_box.left};          
      }

      if (box)
      {
        _tooltip_ele.style.left = (box.left + DISTANCE_X) + "px";
        _tooltip_ele.style.top = (box.bottom + DISTANCE_Y) + "px";
      }
    }
  };

  var _hide_tooltip = function(tooltip)
  {
    if (tooltip == _current_tooltip)
      _hide_tooltip();
  };

  var _setup = function()
  {
    document.addEventListener("mouseover", _mouseover, false);
    var tmpl = ["div", "id", "tooltip-container", "style", "top: -100px;"];
    _tooltip_ele = (document.body || document.documentElement).render(tmpl);
  };

  /* implementation */

  this.register = function(name, keep_on_hover)
  {
    if (!_is_setup)
    {
      if (document.readyState == "complete")
        _setup();
      else
        document.addEvenetListener("load", _setup, false);
      _is_setup = true;  
    }
    _tooltips[name] = new Tooltip();
    _tooltips[name]._container = document.render(["div", "class", "tooltip"]);
    _tooltips[name]._keep_on_hover = Boolean(keep_on_hover);
    return _tooltips[name];
  };

  this.unregister = function(name, tooltip)
  {
    if (_tooltips[name] && _tooltips[name] == tooltip)
      _tooltips[name] = null;
  };
  
}).apply(TooltipManager);
