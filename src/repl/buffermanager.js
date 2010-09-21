/**
 * Escape Meta Alt Control Shift
 *
 */
function BufferManager(textarea)
{
  this._textarea = textarea;

  this.handle = function(evt) {
      return this._handle_event(evt);
  };

  this._handle_event = function(evt)
  {
    if (evt.ctrlKey)
    {
      switch (evt.keyCode)
      {
        case 97: // a key. ctrl-a == move to start of line
          this._move_to_beginning_of_line();
          return true;
        case 101: // e key. ctrl-e == move to end of line
          this._move_to_end_of_line();
          return true;
        case 107: // k key. ctrl-k == kill to end of line
          this._kill_to_end_of_line();
          return true;
        case 119: // w key. ctrl-w == kill word backwards
          this._kill_word_backwards();
          return true;
      }
    }
    return false;
  };

  this._move_to_beginning_of_line = function()
  {
    this._put_cursor(0);
  };

  this._move_to_end_of_line = function()
  {
    this._put_cursor(this._textarea.value.length);
  };

  this._kill_to_end_of_line = function()
  {
    var pos = this._textarea.selectionStart;
    this._textarea.value = this._textarea.value.slice(0, pos);
  };

  this._kill_word_backwards = function()
  {
    var s = this._textarea.value.slice(0, this._textarea.selectionStart-1);
    var pos = s.lastIndexOf(" ") + 1;
    this._textarea.value = this._textarea.value.slice(0, pos) + this._textarea.value.slice(this._textarea.selectionStart);
    this._textarea.selectionStart = pos;
    this._textarea.selectionEnd = pos;
  };

  this._put_cursor = function(offset)
  {
    this._textarea.selectionStart = offset;
    this._textarea.selectionEnd = offset;
  };
}