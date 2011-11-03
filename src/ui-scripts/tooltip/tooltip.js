var Tooltip = function(tooltip_manager, keep_on_hover) 
{
  this._init(tooltip_manager, keep_on_hover);
};

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
    * @param box The box to position the tootip. Optional. Only left, top and 
    * bottom are used. By default the box is given by the intersection of the 
    * vertical line given by the mouse event left postion and the dimension
    * and position of the target element.
    */
  this.show = function(box){};

  /**
    * To hide the tooltip.
    */
  this.hide = function(){};

  /**
    * A pointer to the HTMLElement to create the content of the tooltip.
    */
  this.container = null;

  /**
    * A flag to indicate if the tooltip should be hidden or not on hovering
    * the tooltip itself.
    */
  this.keep_on_hover = false;

  /* private */

  this._init = function(tooltip_manager, keep_on_hover)
  {
    this.keep_on_hover = Boolean(keep_on_hover);
    this.container = document.render(['div', 'class', 'tooltip']);
    this._tooltip_handler = tooltip_manager;
  };
  
  /* implementation */
  
  this.show = function(box)
  {
    this._tooltip_handler.show_tooltip(this, box);
  };

  this.hide = function()
  {
    this._tooltip_handler.hide_tooltip(this);
  };
};

var TooltipManager = function() {};


(function()
{
  /* static methods of TooltipManager */

  this.register_tooltip = function(name, keep_on_hover) {};
  this.unregister_tooltip = function(name, tooltip) {};
  this.show_tooltip = function(tooltip, box) {};
  this.hide_tooltip = function(tooltip) {};

  /* constants */

  const DATA_TOOLTIP = "data-tooltip";
  const HIDE_DELAY = 120;
  const SHOW_DELAY = 120;
  const DISTANCE_X = 10;
  const DISTANCE_Y = 10;

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
        if (_current_tooltip && _current_tooltip.keep_on_hover)
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
          _tooltip_ele.appendChild(_current_tooltip.container);
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
    _hide_timeouts.push(setTimeout(_hide_tooltip, HIDE_DELAY));
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
    _show_timeouts.push(setTimeout(_show_tooltip, SHOW_DELAY));
  };

  var _clear_show_timeout = function()
  {
    while(_show_timeouts.length)
      clearTimeout(_show_timeouts.pop());
  };

  var _show_tooltip = function(event, ele, name)
  {
    if (_last_event && _last_handler_ele)
      _current_tooltip.ontooltip(_last_event, _last_handler_ele);
  };

  var _hide_tooltip = function()
  {
    _clear_show_timeout();
    if (_current_tooltip)
      _current_tooltip.onhide();

    _tooltip_ele.innerHTML = "";
    _tooltip_ele.style.cssText = "";
    _current_tooltip = null;
    _last_handler_ele = null;
  };

  var _setup = function()
  {
    document.addEventListener('mouseover', _mouseover, false);
    var tmpl =['div', 'id', 'tooltip-container', 'style', 'top: -100px;'];
    _tooltip_ele = (document.body || document.documentElement).render(tmpl);
  };

  /* implementation */

  this.register_tooltip = function(name, keep_on_hover)
  {
    if (!_is_setup)
    {
      if (document.readyState == "complete")
        _setup();
      else
        document.addEvenetListener("load", _setup, false);
      _is_setup = true;  
    }
    _tooltips[name] = new Tooltip(this, keep_on_hover);
    return _tooltips[name];
  };

  this.unregister_tooltip = function(name, tooltip)
  {
    if (_tooltips[name] && _tooltips[name] == tooltip)
      _tooltips[name] = null;
  };

  this.show_tooltip = function(tooltip, box)
  {
    if (tooltip == _current_tooltip)
    {
      if (!box && _last_handler_ele)
      {
        var _handler_ele_box = _last_handler_ele.getBoundingClientRect();
        box = {top: _handler_ele_box.top,
               bottom: _handler_ele_box.bottom,
               left: _last_event ? _last_event.clientX : _handler_ele_box.left};          
      }

      if (box)
      {
        _tooltip_ele.style.left = (box.left + DISTANCE_X) + "px";
        _tooltip_ele.style.top = (box.bottom + DISTANCE_Y) + "px";
      }
    }
  };

  this.hide_tooltip = function(tooltip)
  {
    if (tooltip == _current_tooltip)
      _hide_tooltip();
  };
  
}).apply(TooltipManager);
