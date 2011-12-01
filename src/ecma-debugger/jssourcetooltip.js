window.cls || (window.cls = {});

cls.JSSourceTooltip = function(view)
{

  var POLL_INTERVAL = 150;
  var MAX = Math.max;
  var MIN = Math.min;
  var POW = Math.pow;
  var MIN_RADIUS = 2;
  var _tooltip = null;
  var _view = null;
  var _tokenizer = null;
  var _poll_interval = 0;
  var _tooltip_target_ele = null;
  var _last_move_event = null;
  var _is_token_selected = false;
  var _mouse_positions = [];
  var _container = null;
  var _container_box = null;
  var _char_width = 0;
  var _line_height = 0;
  var _default_offset = 10;
  var _total_y_offset = 0;
  var _last_poll = {};
  var _identifier = null;
  var _identifier_boxes = [];
  var _identifier_out_count = 0;
  // line states
  /*
  var DEFAULT_STATE = window.cls.NewScript.DEFAULT_STATE = 0;
  var SINGLE_QUOTE_STATE = window.cls.NewScript.SINGLE_QUOTE_STATE = 1;
  var DOUBLE_QUOTE_STATE = window.cls.NewScript.DOUBLE_QUOTE_STATE = 2;
  var REG_EXP_STATE = window.cls.NewScript.REG_EXP_STATE = 3;
  var COMMENT_STATE = window.cls.NewScript.COMMENT_STATE = 4;
  */
  // token types
  var WHITESPACE = cls.SimpleJSParser.WHITESPACE;
  var LINETERMINATOR = cls.SimpleJSParser.LINETERMINATOR;
  var IDENTIFIER = cls.SimpleJSParser.IDENTIFIER;
  var NUMBER = cls.SimpleJSParser.NUMBER;
  var STRING = cls.SimpleJSParser.STRING;
  var PUNCTUATOR = cls.SimpleJSParser.PUNCTUATOR;
  var DIV_PUNCTUATOR = cls.SimpleJSParser.DIV_PUNCTUATOR;
  var REG_EXP = cls.SimpleJSParser.REG_EXP;
  var COMMENT = cls.SimpleJSParser.COMMENT;

  // TODO reset char-width and line-height on the according evemnt

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
    if (!_last_move_event)
      return;

    if (_identifier)
    {
      if (_is_over_identifier_boxes(_last_move_event))
      {
        _identifier_out_count = 0;
        return;
      }

      if (_identifier_out_count > 1)
      {
        _identifier = null;
        _view.higlight_slice(-1);
        _tooltip.hide();
      }
      else
      {
        _identifier_out_count += 1;
        return;
      }
    }
    
    while (_mouse_positions.length > 2)
      _mouse_positions.shift();

    _mouse_positions.push({x: _last_move_event.clientX,
                           y: _last_move_event.clientY});
    var center = _get_mouse_pos_center();
    if (center && center.r <= MIN_RADIUS)
    {
      var script = _view.get_current_script();
      if (script)
      {
        var offset_y = center.y - _container_box.top;
        var line_number = _view.get_line_number_with_offset(offset_y);
        var line = script.get_line(line_number);
        var offset_x = center.x + _container.scrollLeft - _total_y_offset;
        var char_offset = _get_char_offset(line, offset_x);
        if (char_offset > -1 &&
            !(_last_poll.script == script &&
              _last_poll.line_number == line_number && 
              _last_poll.char_offset == char_offset))
        {
          _last_poll.script = script;
          _last_poll.line_number = line_number;
          _last_poll.char_offset = char_offset;
          _last_poll.center = center;
          _handle_poll_position(script, line_number, char_offset, center);
        }
        else
        {
          // TODO
        }
      }
      else
      {
        // TODO
      }
    }
    else
    {
      // TODO
      // _view.higlight_slice(-1); 
      _tooltip.hide();
    }

  };

  var _is_over_identifier_boxes = function(event)
  {
    // TODO optimize?
    var off_x = _total_y_offset - _container.scrollLeft;
    var off_y = _container_box.top - (_view.getTopLine() - 1) * _line_height;
    var e_x = event.clientX - off_x;
    var e_y = event.clientY - off_y;

    for (var i = 0, box; box = _identifier_boxes[i]; i++)
    {
      if (e_x >= box.left && e_x <= box.right &&
          e_y >= box.top && e_y <= box.bottom)
        return true;
    }
    return false;
  };

  var _handle_poll_position = function(script, line_number, char_offset, center)
  {
    opera.postError('handle')
    _identifier = _get_identifier(script, line_number, char_offset);
    var line = script.get_line(line_number);
    // for now the single char
    _identifier = {start_line: line_number,
                   start_offset: char_offset,
                   end_line: line_number,
                   end_offset: char_offset};
    _identifier_out_count = 0;
    _update_identifier_boxes(script, _identifier);

    _view.higlight_slice(line_number, char_offset, 1);
    //_view.show_and_flash_line(script.script_id, line_number);
    // opera.postError((c++) +', '+char_offset +', '+line[char_offset]);
    /*
    _tooltip.show("test " + (c++), {left: center.x,
                                    top: center.y,
                                    right: center.x,
                                    bottom: center.y});
    */
  };

  var _get_identifier = function(script, line_number, char_offset)
  {
    var line = script.get_line(line_number);
    var start_state = script.state_arr[line_number - 1];
    var tokens = [];
    var TYPE = 0;
    var VALUE = 1;

    _tokenizer.tokenize(line, function(token_type, token)
    {
      tokens.push([token_type, token]);
    }, false, start_state);

    for (var i = 0, sum = 0; i < tokens.length; i++)
    {
      sum += tokens[i][VALUE].length;
      if (sum > char_offset)
        break;
    }

    /*
    WHITESPACE 
    LINETERMINATOR 
    IDENTIFIER 
    NUMBER 
    STRING 
    PUNCTUATOR 
    DIV_PUNCTUATOR 
    REG_EXP 
    COMMENT 

  var PUNCTUATOR_CHARS =
  {
    '{': 1,
    '}': 1,
    '(': 1,
    ')': 1,
    '[': 1,
    ']': 1,
    ';': 1,
    ',': 1,
    '<': 1,
    '>': 1,
    '=': 1,
    '!': 1,
    '+': 1,
    '-': 1,
    '*': 1,
    '%': 1,
    '&': 1,
    '|': 1,
    '^': 1,
    '~': 1,
    '?': 1,
    ':': 1,
    '.': 1,
  }
    */

    if (!token[i] || ["WHITESPACE",
                      "LINETERMINATOR",
                      "STRING",
                      "COMMENT",
                      "NUMBER"].contains(token[i][TYPE]))
      return null;

    switch (token[i][TYPE])
    {
      case IDENTIFIER:
        return _get_identifier_chain(script, line_number, tokens, i);
      case PUNCTUATOR:
        var value = token[i][VALUE];
        if (value == ".")
          return _get_identifier_chain(script, line_number, tokens, i);
        if (value == "[" || value == "]")
          return null;
    }
    return null;
    // opera.postError(JSON.stringify(tokens))
  };

  /*
      WHITESPACE 
    LINETERMINATOR 
    IDENTIFIER 
    NUMBER 
    STRING 
    PUNCTUATOR 
    DIV_PUNCTUATOR 
    REG_EXP 
    COMMENT
    */

  var _get_identifier_chain = function(script, line_number, tokens, match_index)
  {
    var ret = {start_line: 0, start_offset: 0, end_line: 0, end_offset: 0};
    var start_line = line_number;
    var got_start = false;
    var bracket_count = 0;
    var TYPE = 0;
    var VALUE = 1;
    var index = 0;
    var previous_was_bracket = false;

    while (!got_start)
    {
      for (index = match_index; index > -1; index--)
      {
        switch (tokens[index][TYPE])
        {
          case IDENTIFIER:
          case WHITESPACE:
          case LINETERMINATOR:
          {
            previous_was_bracket = false;
            continue;
          }
          case STRING:
          case NUMBER:
          {
            if (previous_was_bracket)
            {
              previous_was_bracket = false; 
              continue;
            }
          }
          case PUNCTUATOR:
          {
            var value = tokens[index][VALUE];
            if (value == ".")
            {
              previous_was_bracket = false; 
              continue;
            }
            if ((value == "[" || value == "]") && bracket_count > -1)
            {
              previous_was_bracket = true;
              continue;
            }
          }
              
        }
      }
    }
  };


  _update_identifier_boxes = function(script, identifier)
  {
    // translates the current selected identifier to dimesion boxes
    // position and dimensions are absolute to the source text
    var line_number = _identifier.start_line;
    var line = script.get_line(line_number);
    var start_offset = _identifier.start_offset;
    var end_offset = 0;
    _identifier_boxes = [];
    while (true)
    {
      var box = {};
      box.left = _get_pixel_offset(line, start_offset);
      if (line_number < _identifier.end_line)
        box.right = _get_pixel_offset(line, line.length + 1);
      else
        box.right = _get_pixel_offset(line, _identifier.end_offset + 1);
      box.top = (line_number - 1) * _line_height;
      box.bottom = line_number * _line_height;
      _identifier_boxes.push(box);
      if (line_number == _identifier.end_line ||
          line_number >= script.line_arr.length)
        break;
      else
        line_number += 1;
      start_offset = 0;
    }
  };

  var _get_tab_size = function()
  {
    var style_dec = document.styleSheets.getDeclaration("#js-source-content div");
    return style_dec ? parseInt(style_dec.getPropertyValue("-o-tab-size")) : 0;
  };

  var _get_char_offset = function(line, offset)
  {
    offset /= _char_width;
    for (var i = 0, l = line.length, offset_count = 0; i < l; i++)
    {
      offset_count += line[i] == "\t"
                     ? _tab_size - (offset_count % _tab_size)
                     : 1;
      if (offset_count > offset)
        return i;
    }

    return -1;
  };

  var _get_pixel_offset = function(line, char_offset)
  {
    for (var i = 0, offset_count = 0, char = ""; i < char_offset; i++)
    {
      char = line[i];
      if (char == "\n" || char == "\r")
        continue;

      offset_count += char == "\t"
                     ? _tab_size - offset_count % _tab_size
                     : 1;
    }
    return offset_count * _char_width;
  };

  var _ontooltip = function(event, target)
  {
    if (!_poll_interval)
    {
      if (!_char_width)
      {
        _char_width = defaults["js-source-char-width"];
        _line_height = defaults["js-source-line-height"];
        _tab_size = _get_tab_size();
        _default_offset = defaults["js-default-text-offset"];
        // TODO reset on the according event
      }

      var container = _view.get_scroll_container();
      if (container)
      {
        // TODO resize events
        _container = container;
        _container_box = container.getBoundingClientRect();
        _tooltip_target_ele = target;
        _tooltip_target_ele.addEventListener('mousemove', _onmousemove, false);
        while (_mouse_positions.length)
          _mouse_positions.pop();
        _total_y_offset = _container_box.left + _default_offset;
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
      _container = null;
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
    _tokenizer = new cls.SimpleJSParser();
    _tooltip = Tooltips.register(cls.JSSourceTooltip.tooltip_name, true);
    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _onhide;
    _tooltip.ontooltipenter = _ontooltipenter;
    _tooltip.ontooltipleave = _ontooltipleave;
    
  };

  _init(view);
};

cls.JSSourceTooltip.tooltip_name = "js-source";



