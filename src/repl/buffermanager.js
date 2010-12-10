window.cls = window.cls || (window.cls = {});

/**
 * Escape Meta Alt Control Shift
 *
 */
cls.BufferManager = function(textarea)
{
  this._textarea = textarea;
  this._kill_buffer = "";

  this.move_to_beginning_of_line = function()
  {
    this.put_cursor(0);
  };

  this.move_to_end_of_line = function()
  {
    this.put_cursor(this._textarea.value.length);
  };

  this.kill_to_end_of_line = function()
  {
    var pos = this.get_cursor();
    this._kill_buffer = this._textarea.value.slice(pos);
    this.set_value(this._textarea.value.slice(0, pos));
  };

  this.kill_to_beginning_of_line = function()
  {
    var pos = this.get_cursor();
    this._kill_buffer = this._textarea.value.slice(0, pos);
    this.set_value(this._textarea.value.slice(pos), 0);
  };

  this.kill_word_backwards = function()
  {
    var textarea = this._textarea;
    var str_before_cursor = textarea.value.slice(0, textarea.selectionStart);
    var char_before_cursor = str_before_cursor.slice(-1);
    var new_str_before_cursor = "";
    var replace_regexp = "";

    /**
     * Word boundaries are whitespace and non-alphanumeric characters
     */

    // Somewhat VIM inspired
    if (/\s/.test(char_before_cursor))
    {
      replace_regexp = /\w*\s+$/;
    }
    else if (/\w$/.test(char_before_cursor))
    {
      replace_regexp = /\s*\w+$/;
    }
    else if (/\W$/.test(char_before_cursor))
    {
      replace_regexp = /\W+$/;
    }

    new_str_before_cursor = str_before_cursor.replace(replace_regexp, "");
    this._kill_buffer = textarea.value.slice(new_str_before_cursor.length,
                                                   this.get_cursor());
    this.set_value(new_str_before_cursor + this.get_value(this.get_cursor()),
                   new_str_before_cursor.length);
  };

  this.yank = function()
  {
    var pos = this.get_cursor();
    var pre = this.get_value(0, pos);
    var post = this.get_value(pos);
    this.set_value(pre + this._kill_buffer + post,
                   pre.length + this._kill_buffer.length);
  };

  this.put_cursor = function(offset)
  {
    this._textarea.selectionStart = offset;
    this._textarea.selectionEnd = offset;
  };

  this.get_cursor = function()
  {
    return this._textarea.selectionStart;
  };

  this.set_value = function(value, cursorpos)
  {
    this._textarea.value = value;
    if (cursorpos !== undefined)
    {
      this.put_cursor(cursorpos);
    }
  };

  this.insert_at_point = function(str)
  {
    var point = this.get_cursor();
    var val = this._textarea.value;
    val = val.slice(0, point) + str + val.slice(point);
    this._textarea.value = val;
    this.put_cursor(point+str.length);
  }

  this.get_value = function(start, end)
  {
    if (start === undefined)
    {
      return this._textarea.value;
    }
    else if (end === undefined)
    {
      return this._textarea.value.slice(start);
    }
    else
    {
      return this._textarea.value.slice(start, end);
    }
  };

  this.clear = function()
  {
    this.set_value("");
  };
}
