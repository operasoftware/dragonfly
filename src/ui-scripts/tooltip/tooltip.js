var Tooltips = function() {};

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

    this.ontooltipenter = function(){};

    this.ontooltipleave = function(){};

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

    /**
      * Default implementation.
      */
    this.ontooltip = function(event, target)
    {
      this.show();
    };
  };



  /* constants */

  const DATA_TOOLTIP = "data-tooltip";
  const DATA_TOOLTIP_TEXT = "data-tooltip-text";
  const HIDE_DELAY = 120;
  const SHOW_DELAY = 110;
  const DISTANCE_X = 0;
  const DISTANCE_Y = -3;
  const MARGIN_Y = 15;
  const MARGIN_X = 30;

  /* private */

  var _tooltips = {};
  var _is_setup = false;
  var _tooltip_ele = null;
  var _tooltip_ele_first_child = null;
  var _current_tooltip = null;
  var _last_handler_ele = null;
  var _last_event = null;
  var _hide_timeouts = [];
  var _show_timeouts = [];
  var _window_width = 0;
  var _window_height = 0;
  var _padding_width = 0;
  var _padding_height = 0;

  var store_window_dimensions = function()
  {
    _window_width = window.innerWidth;
    _window_height = window.innerHeight;
  };

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
      if (name && _tooltips[name]) 
      {
        if (ele == _last_handler_ele)
          return;

        if (_current_tooltip != _tooltips[name])
        {
          _current_tooltip = _tooltips[name];
          _tooltip_ele_first_child.innerHTML = "";
          _tooltip_ele_first_child.appendChild(_current_tooltip._container);
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
    if (!_show_timeouts.length)
      _show_timeouts.push(setTimeout(_handle_show_tooltip, SHOW_DELAY));
  };

  var _clear_show_timeout = function()
  {
    while(_show_timeouts.length)
      clearTimeout(_show_timeouts.pop());
  };

  var _handle_show_tooltip = function(event, ele, name)
  {
    _clear_show_timeout();
    if (_last_event && _last_handler_ele)
    {
      if (!document.documentElement.contains(_last_handler_ele))
      {
        var target = document.elementFromPoint(_last_event.clientX,
                                               _last_event.clientY);
        while (target && target.nodeType == document.ELEMENT_NODE)
        {
          var name = target.getAttribute(DATA_TOOLTIP);
          if (name && _tooltips[name] && _current_tooltip == _tooltips[name])
            break;
          target = target.parentNode;
        }
        _last_handler_ele = target;
        if (!_last_handler_ele)
          return;
      }
      _current_tooltip.ontooltip(_last_event, _last_handler_ele);
    }
  };

  var _handle_hide_tooltip = function()
  {
    _clear_show_timeout();
    if (_current_tooltip)
      _current_tooltip.onhide();

    _tooltip_ele_first_child.innerHTML = "";
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
          _current_tooltip._container.clearAndRender(content);
      }

      if (!box && _last_handler_ele)
      {
        var handler_ele_box = _last_handler_ele.getBoundingClientRect();
        box = {top: handler_ele_box.top,
               bottom: handler_ele_box.bottom,
               left: _last_event ? _last_event.clientX : handler_ele_box.left,
               right: _last_event ? _last_event.clientX : handler_ele_box.right};          
      }

      if (box)
      {
        var top = box.bottom + DISTANCE_Y;
        var max_h = 0;
        if (top < _window_height / 2)
        {
          _tooltip_ele.style.top = top + "px";
          _tooltip_ele.style.bottom = "auto";
          max_h = _window_height - top - MARGIN_Y - _padding_height;
          _tooltip_ele_first_child.style.maxHeight = max_h + "px"; 
        }
        else
        {
          var bottom = _window_height - box.top + DISTANCE_Y;
          _tooltip_ele.style.bottom = bottom + "px";
          _tooltip_ele.style.top = "auto";
          max_h = _window_height - bottom - MARGIN_Y - _padding_height;
          _tooltip_ele_first_child.style.maxHeight = max_h + "px"; 
        }
        
        var left = box.left + DISTANCE_X;
        var max_w = 0;
        if (left < _window_width / 2)
        {
          _tooltip_ele.style.left = left + "px";
          _tooltip_ele.style.right = "auto";
          max_w = _window_width - left - MARGIN_X - _padding_width;
          _tooltip_ele_first_child.style.maxWidth = max_w + "px"; 
        }
        else
        {
          var right = _window_width - box.right + DISTANCE_X;
          _tooltip_ele.style.right = right + "px";
          _tooltip_ele.style.left = "auto";
          max_w = _window_width - right - MARGIN_X - _padding_width;
          _tooltip_ele_first_child.style.maxWidth = max_w + "px"; 
        }
      }
    }
  };

  var _hide_tooltip = function(tooltip)
  {
    if (tooltip == _current_tooltip)
      _hide_tooltip();
  };

  var _on_tooltip_enter = function(event)
  {
    if (_current_tooltip && _current_tooltip.ontooltipenter)
      _current_tooltip.ontooltipenter(event);
  };

  var _on_tooltip_leave = function(event)
  {
    if (_current_tooltip && _current_tooltip.ontooltipleave)
      _current_tooltip.ontooltipleave(event);
  };

  var _setup = function()
  {
    document.addEventListener("mouseover", _mouseover, false);
    var tmpl = ["div", ["div", "id", "tooltip-background"],
                "id", "tooltip-container"];
    _tooltip_ele = (document.body || document.documentElement).render(tmpl);
    _tooltip_ele.addEventListener("mouseenter", _on_tooltip_enter, false);
    _tooltip_ele.addEventListener("mouseleave", _on_tooltip_leave, false);
    _tooltip_ele_first_child = _tooltip_ele.firstChild;
    window.addEventListener("resize", store_window_dimensions, false);
    store_window_dimensions();
    var style = document.styleSheets.getDeclaration("#tooltip-container");
    _padding_width = parseInt(style.getPropertyValue("padding-left")) +
                     parseInt(style.getPropertyValue("padding-right"));
    _padding_height = parseInt(style.getPropertyValue("padding-top")) +
                      parseInt(style.getPropertyValue("padding-bottom"));
  };

  /* implementation */

  this.register = function(name, keep_on_hover)
  {
    if (!_is_setup)
    {
      if (document.readyState == "complete")
        _setup();
      else
        document.addEventListener("load", _setup, false);
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
  
}).apply(Tooltips);
