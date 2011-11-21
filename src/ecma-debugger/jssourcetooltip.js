window.cls || (window.cls = {});

cls.JSSourceTooltip = function(view)
{

  const POLL_INTERVAL = 150;
  const MAX = Math.max;
  const MIN = Math.min;
  const POW = Math.pow;
  const MIN_RADIUS = 2;

  var _tooltip = null;
  var _view = null;
  var _poll_interval = 0;
  var _tooltip_target_ele = null;
  var _last_move_event = null;
  var _is_token_selected = false;
  var _mouse_positions = [];
  var _container_box = null;

  var _onmousemove = function(event)
  {
    _last_move_event = event;
  };

  var _get_mouse_pos_center = function()
  {
    var center = null;
    if (_mouse_positions.length > 2)
    {
      var min_x = MIN(_mouse_positions[0].x,
                      _mouse_positions[1].x,
                      _mouse_positions[2].x);
      var max_x = MAX(_mouse_positions[0].x,
                      _mouse_positions[1].x,
                      _mouse_positions[2].x);
      var min_y = MIN(_mouse_positions[0].y,
                      _mouse_positions[1].y,
                      _mouse_positions[2].y);
      var max_y = MAX(_mouse_positions[0].y,
                      _mouse_positions[1].y,
                      _mouse_positions[2].y);
      var dx = max_x - min_x;
      var dy = max_y - min_y;

      center = {x: min_x + dx / 2,
                y: min_y + dy / 2,
                r: POW(POW(dx / 2, 2) + POW(dy / 2, 2), 0.5)};
    }

    return center;
  };

  var c = 0;

  var _poll_position = function()
  {
    if (_is_token_selected)
    {
      
    }
    else if (_last_move_event)
    {
      while (_mouse_positions.length > 2)
        _mouse_positions.shift();

      _mouse_positions.push({x: _last_move_event.clientX,
                             y: _last_move_event.clientY});
      
      var center = _get_mouse_pos_center();



      if (center && center.r <= MIN_RADIUS)
      {
        _tooltip.show("test " + (c++), {left: center.x,
                                        top: center.y,
                                        right: center.x,
                                        bottom: center.y});
      }
      else
      {
        _tooltip.hide();
      }
      
    }
  };

  var _ontooltip = function(event, target)
  {
    if (!_poll_interval)
    {
      var container = _view.get_container();
      if (container)
      {
        // TODO resize events

        _container_box = container.getBoundingClientRect();
        _tooltip_target_ele = target;
        _tooltip_target_ele.addEventListener('mousemove', _onmousemove, false);
        while (_mouse_positions.length)
          _mouse_positions.pop();

        _poll_interval = setInterval(_poll_position, POLL_INTERVAL);
      }
    }    
  };

  var _onhide = function()
  {
    if (_poll_interval)
    {
      clearInterval(_poll_interval);
      _tooltip_target_ele.removeEventListener('mousemove', _onmousemove, false);
      _poll_interval = 0;
      _tooltip_target_ele = null;
      _container_box = null;
    }
  };

  var _ontooltipenter = function(event)
  {
    
  };

  var _ontooltipleave = function(event)
  {
    
  };

  var _init = function(view)
  {
    _view = view;
    _tooltip = Tooltips.register(cls.JSSourceTooltip.tooltip_name, true);
    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _onhide;
    _tooltip.ontooltipenter = _ontooltipenter;
    _tooltip.ontooltipleave = _ontooltipleave;
    
  };

  _init(view);
};

cls.JSSourceTooltip.tooltip_name = "js-source";



