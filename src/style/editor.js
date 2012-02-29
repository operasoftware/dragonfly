// assert: a element wich is editable has a monospace font
// TODO make it more general so it can be used for other views then just the css inspector
// TODO make this a subclass of BaseEditor
/**
 * @constructor
 */
var Editor = function(actions)
{
  var REPLACE_TYPE_SELECTION = 1;
  var REPLACE_TYPE_TOKEN = 2;
  var REPLACE_TYPE_VALUE = 3;
  var MINUS = -1;
  var PLUS = 1;

  // Positions returned from get_properties()
  var PROPERTY = 0;
  var VALUE = 1;
  var PRIORITY = 2;

  // Edit modes
  this.MODE_CSS = 1;
  this.MODE_SVG = 2;

  // TODO: some of these should be private
  this.char_width = 0;
  this.line_height = 0;
  this.textarea_container = null;
  this.textarea = null;
  this.host_element_border_padding_left = 0;
  this.host_element_border_padding_top = 0;
  this.context_cur_prop = "";
  this.context_cur_value = "";
  this.context_cur_priority = "";
  this.context_cur_text_content = "";
  this.context_last_prop = null;
  this.context_edit_mode = this.MODE_CSS;
  this.colors = new Color();

  this._stylesheets = window.stylesheets;
  this._element_style = window.element_style;
  this._templates = new StylesheetTemplates();
  this._event = document.createEvent("Event");
  this._actions = actions;
  this._tab_context_value = '';
  this._tab_context_tokens = null;

  this.base_style = {
    'font-family': '',
    'line-height': 0,
    'font-size': 0
  };

  this.get_base_style = function(ele)
  {
    var style = window.getComputedStyle(ele, null);
    var props = ['font-family', 'line-height', 'font-size'];
    var span = document.createElement('test-element');
    var css_text = 'display:block;position:absolute;left:-100px;top:0;white-space:pre;';

    for (var i = 0, prop; prop = props[i]; i++)
    {
      this.base_style[prop] = style.getPropertyValue(prop);
      css_text += prop + ':' + this.base_style[prop] + ';';
    }

    span.textContent = '1234567890';
    document.documentElement.appendChild(span);
    span.style.cssText = css_text;
    this.char_width = span.offsetWidth / 10;
    this.base_style['line-height'] = (this.line_height = span.offsetHeight) + 'px';
    document.documentElement.removeChild(span);

    // host element style
    this.host_element_border_padding_left =
      parseInt(style.getPropertyValue('padding-left')) +
      parseInt(style.getPropertyValue('border-left-width'));
    this.host_element_border_padding_top =
      parseInt(style.getPropertyValue('padding-top')) +
      parseInt(style.getPropertyValue('border-top-width'));

    css_text = '';
    for (var prop in this.base_style)
    {
      css_text += prop + ':' + this.base_style[prop] + ';';
    }

    this.textarea_container = document.createElement('textarea-container');
    this.textarea = this.textarea_container.render(["_auto_height_textarea"]);
    this.textarea.style.cssText = css_text;
    this.textarea.oninput = this._input_handler;
  };

  // TODO: this should use the CSS tokenizer
  this._get_all_tokens = function()
  {
    var SPACE = 1;
    var COMMA = 2;
    var BRACKET_OPEN = 3;
    var BRACKET_CLOSE = 4;
    var END = 5;
    var SEMICOLON = 6;

    var re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g;
    var re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g;
    var value = this.textarea.value;
    var cur_pos = 0;
    // last char would be ;
    var char_pos = value.length - 2;
    var match_token = null;
    var ret = [];

    re_str.lastIndex = 0;
    var match_str = re_str.exec(value);

    if ((cur_pos = value.indexOf(':')) > -1)
    {
      // TODO should test if pos is in match_token string
      //ret[ret.length] = value.slice(0, cur_pos);
      ret.splice(0, 0, value.slice(0, cur_pos), 0, cur_pos);

      cur_pos++;
      while (value.charAt(cur_pos) == ' ')
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;

      while (match_token = re_token.exec(value))
      {
        if (match_str && match_str.index <= re_token.lastIndex + 1)
        {
          ret.splice(ret.length, 0, match_str.index, re_str.lastIndex);
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
        }
        else if (match_token[BRACKET_OPEN])
        {
          cur_pos = re_token.lastIndex;
        }
        else if (match_token.index > cur_pos)
        {
          ret.splice(ret.length, 0, cur_pos, match_token.index + (match_token[SPACE] ? 1 : 0));
        }
        if (match_token.index > char_pos)
        {
          break;
        }
        cur_pos = re_token.lastIndex;
      }
    }
    else
    {
      ret.splice(0, 0, value, 0, value.length);
    }
    return ret;
  };

  this._get_next_token = function(char_pos)
  {
    var re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g;
    var re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g;
    var value = this.textarea.value;
    var cur_pos = 0;
    var match_token = null;

    re_str.lastIndex = 0;
    var match_str = re_str.exec(value);

    // last char would be ;
    if (char_pos >= value.length - 1)
      char_pos = value.length - 2;

    if ((cur_pos = value.indexOf(':')) > -1)
    {
      // TODO should test if pos is in match_token string
      if (cur_pos >= char_pos)
        return {start: 0, end: cur_pos};

      cur_pos++;
      while (value.charAt(cur_pos) == ' ')
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;

      while (match_token = re_token.exec(value))
      {
        if (match_str && match_str.index <= re_token.lastIndex + 1)
        {
          if (re_str.lastIndex >= char_pos)
          {
            return {start: match_str.index, end: re_str.lastIndex};
          }
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }

        if (match_token.index > char_pos)
        {
          if (match_token[3])
          {
            cur_pos = re_token.lastIndex;
            continue;
          }
          return {start:cur_pos, end: match_token.index + (match_token[1] ? 1 : 0)};
        }

        cur_pos = re_token.lastIndex;
      }
    }
    return null;
  };

  // TODO: this should return a CssDeclaration
  this.get_properties = function()
  {
    var re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g;
    var re_token = /(;)|($)/g;
    var re_important = /\s*!\s*important/;
    var value = this.textarea.value;
    var last_pos = 0;
    var cur_pos = 0;
    var match_token = null;
    var match_important = null;
    var ret = [];

    while ((cur_pos = value.indexOf(':', last_pos)) > -1)
    {
      var prop = value.slice(last_pos, cur_pos);
      // TODO should test if pos is in match_token string
      cur_pos++;
      while (value.charAt(cur_pos) == ' ' || value.charAt(cur_pos) == '\n')
      {
        cur_pos++;
      }
      re_str.lastIndex = re_token.lastIndex = cur_pos;
      var match_str = re_str.exec(value);

      while (match_token = re_token.exec(value))
      {
        if (match_str && match_token.index < re_str.lastIndex)
        {
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }
        break;
      }

      if (match_token)
      {
        var val = value.slice(cur_pos, re_token.lastIndex - (match_token[1] ? 1 : 0));
        var priority = 0;
        if (match_important = re_important.exec(val))
        {
          val = val.slice(0, match_important.index);
          priority = 1;
        }
        ret.splice(ret.length, 0, prop, val, priority);

        last_pos = re_token.lastIndex;
        if (last_pos + 1 >= value.length)
          break;
      }
    }

    if (last_pos < value.length && (val = value.slice(last_pos)))
      ret.push(val);

    return ret;
  };

  this._get_char_position = function(event)
  {
    var box = this.textarea.getBoundingClientRect();
    var left = event.clientX - box.left;
    var top = event.clientY - box.top;
    var char_offset = 0;
    var cur_top = this.line_height;
    var previous_line_chars = 0;
    var re = /[ -/\n,]/g;
    var match = null;
    var prev_match_index = 0;
    var value = this.textarea.value;
    var max_line_char = this.textarea.offsetWidth / this.char_width >> 0;

    re.lastIndex = 0;

    if (isNaN(left)) // it's a synthetic event
    {
      char_offset = this.context_cur_prop.length + 1;
    }
    else
    {
      while (top > cur_top && (match = re.exec(value)))
      {
        if (match.index - previous_line_chars > max_line_char)
        {
          previous_line_chars = prev_match_index + 1;
          cur_top += this.line_height;
        }
        prev_match_index = match.index;
      }

      if (top < cur_top)
      {
        char_offset =
          previous_line_chars + ((left - (left % this.char_width)) / this.char_width);
      }
    }

    var selection = this._get_next_token(char_offset);

    if (selection)
    {
      this.textarea.selectionStart = selection.start;
      this.textarea.selectionEnd = selection.end;
    }
  };

  this.insert_declaration_edit = function(event, target)
  {
    var rule_ele = event.target.has_attr("parent-node-chain", "rule-id");
    var brace_ele = rule_ele.querySelector(".closing-brace");
    var new_decl = document.createElement("div");
    new_decl.className = "css-declaration";
    new_decl.textContent = "\u00A0"; // Need some content for the height to be set correctly
    rule_ele.insertBefore(new_decl, brace_ele);
    this.edit(event, new_decl, true);
    this.textarea.value = "";
  };

  this.edit = function(event, ref_ele, force_focus)
  {
    var ele = ref_ele || event.target;
    var scroll_pos = force_focus ? null : new Element.ScrollPosition(ele);

    if (!this.base_style['font-size'])
      this.get_base_style(ref_ele || ele);

    if (this.textarea_container.parentElement)
      this.submit();

    this.context_edit_mode = ele.get_attr("parent-node-chain", "rule-id") == "element-svg"
                           ? this.MODE_SVG
                           : this.MODE_CSS;
    this.context_rt_id = parseInt(ele.get_attr('parent-node-chain', 'rt-id'));
    this.context_rule_id = parseInt(ele.get_attr('parent-node-chain', 'rule-id'));

    if (this.context_rule_id)
    {
      this.saved_style_dec = this._element_style.get_rule_by_id(this.context_rule_id);
    }
    else
    {
      this.context_rule_id = parseInt(ele.get_attr('parent-node-chain', 'obj-id'));
      this.saved_style_dec = this._element_style.get_inline_style_dec_by_id(this.context_rule_id);
    }

    this.context_cur_text_content = this.textarea.value = ele.textContent;

    var props = this.get_properties();

    this.context_cur_prop = props[PROPERTY] || '';
    this.context_cur_value = props[VALUE] || '';
    this.context_cur_priority = props[PRIORITY] || 0;
    ele.textContent = '';
    ele.appendChild(this.textarea_container);

    this._resize_textarea();

    // only for click events
    if (event)
    {
      this._get_char_position(event);
      this.textarea.focus();
      if (scroll_pos)
        scroll_pos.reset();
    }
  };

  this.nav_next = function(event, action_id)
  {
    var cur_pos = this.textarea.selectionEnd;

    if (this.textarea.value != this._tab_context_value)
    {
      this._tab_context_tokens = this._get_all_tokens();
      this._tab_context_value = this.textarea.value;
    }

    if (this._tab_context_tokens)
    {
      for (var i = 1; i < this._tab_context_tokens.length; i += 2)
      {
        if (this._tab_context_tokens[i+1] > cur_pos)
        {
          this.textarea.selectionStart = this._tab_context_tokens[i];
          this.textarea.selectionEnd = this._tab_context_tokens[i+1];
          return true;
        }
      }
    }
    return false;
  };

  this.nav_previous = function(event, action_id)
  {
    var cur_pos = this.textarea.selectionStart;

    if (this.textarea.value != this._tab_context_value)
    {
      this._tab_context_tokens = this._get_all_tokens();
      this._tab_context_value = this.textarea.value;
    }

    if (this._tab_context_tokens)
    {
      for (var i = this._tab_context_tokens.length - 1; i > 1; i -= 2)
      {
        if (this._tab_context_tokens[i] < cur_pos)
        {
          this.textarea.selectionStart = this._tab_context_tokens[i-1];
          this.textarea.selectionEnd = this._tab_context_tokens[i];
          return true;
        }
      }
    }
    return false;
  };

  this.focus_first_token = function()
  {
    this._tab_context_tokens = this._get_all_tokens();
    this._tab_context_value = this.textarea.value;
    if (this._tab_context_tokens && this._tab_context_tokens[2])
    {
      this.textarea.selectionStart = this._tab_context_tokens[1];
      this.textarea.selectionEnd = this._tab_context_tokens[2];
    }
    else
    {
      this.textarea.selectionStart = 0;
      this.textarea.selectionEnd = 0;
    }
    this.textarea.focus();
  };

  this.focus_last_token = function()
  {
    this._tab_context_tokens = this._get_all_tokens();
    this._tab_context_value = this.textarea.value;
    if (this._tab_context_tokens && this._tab_context_tokens[2])
    {
      this.textarea.selectionStart = this._tab_context_tokens[this._tab_context_tokens.length-2];
      this.textarea.selectionEnd = this._tab_context_tokens[this._tab_context_tokens.length-1];
    }
    else
    {
      this.textarea.selectionStart = this._tab_context_value.length;
      this.textarea.selectionEnd = this._tab_context_value.length;
    }
    this.textarea.focus();
  };

  this.autocomplete = function(event, action_id)
  {
    var new_start = 0;
    var cur_start = this.textarea.selectionStart;
    var cur_end = this.textarea.selectionEnd;
    var value = this.textarea.value;
    var cur_token = '';

    if (this.textarea.value != this._tab_context_value)
    {
      this._tab_context_tokens = this._get_all_tokens();
      this._tab_context_value = this.textarea.value;
    }

    if (this._tab_context_tokens)
    {
      for (var i = 1; i < this._tab_context_tokens.length; i += 2)
      {
        if (cur_start >= this._tab_context_tokens[i] && cur_start <= this._tab_context_tokens[i+1])
        {
          cur_token = value.slice(this._tab_context_tokens[i], this._tab_context_tokens[i+1]);
          break;
        }
      }
    }

    var suggest = this._get_suggestion(
      this._tab_context_tokens && this._tab_context_tokens[0] || '',
      this._tab_context_tokens && cur_end <= this._tab_context_tokens[2],
      cur_token.toLowerCase(),
      cur_start,
      cur_end,
      action_id
    );

    if (suggest)
    {
      switch (suggest.replace_type)
      {
      case REPLACE_TYPE_SELECTION:
      case REPLACE_TYPE_TOKEN:
        new_start = this._tab_context_tokens[i];
        this.textarea.value =
          value.slice(0, new_start) +
          suggest.value +
          value.slice(this._tab_context_tokens[i+1]);
        this.textarea.selectionStart = suggest.replace_type == REPLACE_TYPE_SELECTION
                                     ? cur_start
                                     : new_start;
        this.textarea.selectionEnd = new_start + suggest.value.length;
        break;

      case REPLACE_TYPE_VALUE:
        new_start = this._tab_context_tokens[2] + 2;
        this.textarea.value =
          this._tab_context_tokens[0] + ': ' + suggest.value + (this.context_cur_priority ? " !important" : "") + ";";
        this.textarea.selectionStart = new_start;
        this.textarea.selectionEnd = new_start + suggest.value.length;
        break;
      }

      this.commit();
    }

    this._resize_textarea();

    return false;
  };

  this._get_suggestion = function(prop_name, is_prop, token, cur_start, cur_end, action_id)
  {
    var re_num = /^(-?)([\d.]+)(.*)$/;
    var match = null;
    var suggest_type = (is_prop && 'suggest_property') ||
                       ((match = re_num.exec(token)) && 'suggest_number') ||
                       ('suggest_value');
    var suggest_handler = this[suggest_type];

    suggest_handler.cursor = this._set_cursor
    (
      suggest_handler.cursor,
      suggest_handler.matches = this[suggest_type](token, cur_start, cur_end, action_id, match),
      action_id
    );

    var suggest = suggest_handler.matches && suggest_handler.matches[suggest_handler.cursor];
    return suggest ? {value: suggest, replace_type: suggest_handler.replace_type}
                   : null;
  };

  this._get_matches_from_list = function(list, set)
  {
    var ret = [];
    var length = list ? list.length : 0;

    if (length == 1)
      return list;

    if (length && set)
    {
      for (var i = 0; i < length; i++)
      {
        if (list[i].indexOf(set) == 0)
          ret.push(list[i]);
      }
    }
    else
    {
       ret = list.slice(0);
    }
    return ret;
  };

  this._set_cursor = function(cur_cursor, matches, action_id)
  {
    if (matches)
    {
      cur_cursor += action_id;
      if (cur_cursor > matches.length - 1)
        cur_cursor = 0;
      else if (cur_cursor < 0)
        cur_cursor = matches.length - 1;
    }
    else
    {
      cur_cursor = 0;
    }

    return cur_cursor;
  };

  this.onclick = function(event)
  {
    if (this.textarea_container.contains(event.target))
      return false;
    this.submit(true);
    return true;
  };

  this.suggest_property = function(token, cur_start, cur_end, action_id, match)
  {
    if (!this.property_list)
    {
      this.property_list = this._stylesheets.get_sorted_properties();
    }
    return this._tab_context_tokens
         ? this._get_matches_from_list(this.property_list,
             this._tab_context_tokens[0].toLowerCase().slice(this._tab_context_tokens[1], cur_start))
         : [];
  };

  this.suggest_property.replace_type = REPLACE_TYPE_SELECTION;
  this.suggest_property.cursor = 0;
  this.suggest_property.matches = null;

  this.suggest_number = function(token, cur_start, cur_end, action_id, match)
  {
    var is_float = /\.(\d+)/.exec(match[2]);
    if (is_float)
      return [(parseFloat(match[1] + match[2]) +
              (action_id == PLUS ? 0.1 : -0.1)).toFixed(is_float[1].length) + match[3]];

    return [(parseInt(match[1] + match[2]) + action_id).toString() + match[3]];
  };

  this.suggest_number.replace_type = REPLACE_TYPE_TOKEN;
  this.suggest_number.cursor = 0;
  this.suggest_number.matches = null;

  this.suggest_value = function(token, cur_start, cur_end, action_id, match)
  {
    if (!this._tab_context_tokens)
      return null;

    var prop = this._tab_context_tokens[0];
    var set = this._tab_context_tokens[3]
            ? this.textarea.value.toLowerCase().slice(this._tab_context_tokens[3], cur_start)
            : "";
    var re_hex = /^#([0-9a-f]{6})$/i;
    var match = null;

    if (set == this.suggest_value.last_set && prop == this.suggest_value.last_prop)
      return this.suggest_value.matches;

    this.suggest_value.last_set = set;
    this.suggest_value.last_prop = prop;

    if (/color/.test(prop) && token && (match = re_hex.exec(token)))
    {
      this.colors.setHex(match[1]);
      var hsl = this.colors.getHSL();
      var rgb = this.colors.getRGB();
      return [
        match[0],
        ('hsl(' + hsl[0] + ',' + parseInt(hsl[1]) + '%,' + parseInt(hsl[2]) + '%)'),
        ('rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')')
      ].concat(window.suggest_values['color']);
    }

    if (window.suggest_values[prop] && window.suggest_values[prop].length)
      return this._get_matches_from_list(window.suggest_values[prop], set);

    return null;
  }

  this.suggest_value.replace_type = REPLACE_TYPE_VALUE;
  this.suggest_value.cursor = 0;
  this.suggest_value.matches = null;
  this.suggest_value.last_set = '';
  this.suggest_value.last_prop = '';

  this.submit = function()
  {
    this.context_last_prop = null;
    var props = this.get_properties();
    var decl_ele = this.textarea.get_ancestor(".css-declaration");
    var decl = new CssDeclaration(
      props[PROPERTY],
      props[VALUE],
      props[PRIORITY],
      true,
      decl_ele.hasClass("disabled") // TODO: should use the model
    );

    if (decl.value)
    {
      // Only add property if something has changed (new or updated value)
      if (!(this.context_cur_prop == decl.property &&
            this.context_cur_value == decl.value &&
            this.context_cur_priority == decl.priority))
      {
        this._actions.set_property(this.context_rt_id, this.context_rule_id, decl, this.context_cur_prop);
      }
      decl_ele.clearAndRender(this._templates.prop_value(decl, true));
    }
    else if (decl.value === "") // If someone deletes just the value and then submits, just re-display it
    {
      decl_ele.clearAndRender(this._templates.prop_value(decl, true));
    }
    else
    {
      decl_ele.innerHTML = "";
    }
  };

  this.commit = function()
  {
    var props = this.get_properties();
    var reset = false;

    while (props.length > 3)
    {
      reset = true;
      var decl_ele = this.textarea_container.parentElement.parentElement.
        insertBefore(document.createElement('div'), this.textarea_container.parentElement);
      var decl = new CssDeclaration(
        props[PROPERTY],
        props[VALUE],
        props[PRIORITY],
        true,
        this.textarea_container.parentNode.hasClass("disabled")
      );
      decl_ele.clearAndRender(this._templates.declaration(decl, true));
      props.splice(0, 3);
    }

    if (reset)
    {
      this.textarea.value =
        props[PROPERTY] + (props[VALUE] ? ': ' + props[VALUE] + (props[PRIORITY] ? ' !important' : '') + ';' : '');

      this.context_cur_text_content =
      this.context_cur_prop =
      this.context_cur_value = '';
      this.context_cur_priority = 0;
    }

    if (props[VALUE])
    {
      var decl = new CssDeclaration(
        props[PROPERTY],
        props[VALUE],
        props[PRIORITY]
      );
      var prop_to_remove = this.context_last_prop || this.context_cur_prop;
      this._actions.set_property(this.context_rt_id, this.context_rule_id, decl, prop_to_remove);
      this.context_last_prop = props[PROPERTY];
    }
    else if ((!props[PROPERTY] || props[PROPERTY] != this.context_cur_prop) && this.context_cur_prop) // if it's overwritten
    {
      this._actions.remove_property(this.context_rt_id, this.context_rule_id, this.context_cur_prop);
    }
  };

  this.enter = function()
  {
    this.context_last_prop = null;
    var props = this.get_properties();
    var keep_edit = false;
    var is_disabled = this.textarea_container.parentNode.hasClass("disabled");

    if (props && props.length == 3)
    {
      if (props[VALUE] === "") // If someone deletes the value and then presses enter, just re-display it
      {
        var decl = new CssDeclaration(
          props[PROPERTY],
          this.context_cur_value,
          this.context_cur_priority,
          true,
          is_disabled
        );
        this.textarea_container.parentElement.clearAndRender(this._templates.prop_value(decl, true));
        return false;
      }
      else if (this.textarea.selectionEnd == this.textarea.value.length ||
               this.textarea.selectionEnd >= this.textarea.value.indexOf(';'))
      {
        // We don't know if the property is valid or not at this point, but
        // it will simply be discarded when setting it back if it's not.
        this.saved_style_dec.declarations.push(new CssDeclaration(
          props[PROPERTY],
          props[VALUE],
          props[PRIORITY]
        ));

        var decl_ele = document.createElement('div');
        decl_ele.className = "css-declaration";

        if (this.textarea_container.parentNode.hasClass("overwritten"))
          decl_ele.addClass("overwritten");

        if (is_disabled)
          decl_ele.addClass("disabled");

        this.textarea_container.parentNode.removeClass("overwritten");
        this.textarea_container.parentNode.removeClass("disabled");
        var decl_ele = this.textarea_container.get_ancestor(".css-rule").
          insertBefore(decl_ele, this.textarea_container.parentElement);
        var decl = new CssDeclaration(
          props[PROPERTY],
          props[VALUE],
          props[PRIORITY],
          true,
          is_disabled
        );
        this.textarea.value = "";
        decl_ele.clearAndRender(this._templates.prop_value(decl, true, true));
        this._resize_textarea();
        this.context_cur_text_content = "";
        this.context_cur_prop = "";
        this.context_cur_value = "";
        this.context_cur_priority = 0;
        keep_edit = true;
      }
      else
      {
        var decl = new CssDeclaration(
          props[PROPERTY],
          props[VALUE],
          props[PRIORITY],
          true,
          is_disabled
        );
        this.textarea_container.parentElement.clearAndRender(this._templates.prop_value(decl, true));
      }
    }
    else
    {
      this.textarea_container.parentElement.innerHTML = "";
    }

    return keep_edit;
  };

  this.escape = function()
  {
    this.context_last_prop = null;
    this._actions.restore_property();
    if (this.context_cur_prop)
    {
      this.textarea.value = this.context_cur_text_content;
      var decl = new CssDeclaration(
        this.context_cur_prop,
        this.context_cur_value,
        this.context_cur_priority,
        true,
        this.textarea_container.parentNode.hasClass("disabled")
      );
      this.textarea_container.parentElement.clearAndRender(this._templates.prop_value(decl, true));
      return true;
    }
    else
    {
      this.textarea.value = '';
      this.textarea_container.parentElement.innerHTML = '';
      return false;
    }
  };

  this._resize_textarea = function()
  {
    // Force height adjust
    this._event.initEvent("heightadjust", true, true);
    this.textarea.dispatchEvent(this._event);
  };

  this._input_handler = function(event)
  {
    this.commit();
  }.bind(this);
};

