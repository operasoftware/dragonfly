var KeyIdentifier = function(callback)
{
  /* interafce */
  this.set_shortcuts = function(shortcuts){};
  
  /* private */

  this._named_shortcuts = {};
  this._char_shortcuts = {};
  this._name_keycode_map = KeyIdentifier.named_keys;

  // these keys don't have a unicode code point
  // the which property in the keypress event is allways set to 0 in Opera
  this._named_keycodes = 
  [
    37, 38, 39, 40, // arrows
    45, 36, 33, // insert, home, page up
    46, 35, 34, // delete, end, page down
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123 // function keys
  ];
  
  // named keys with unicode code points
  // the which property in the keypress event is the same as the keyCode
  this._named_keycodes_u = 
  [
    8, // backspace
    9, // tab
    13, // enter (carriage return)
    27, // escape
    32  // space
  ]; 
  
  this.set_shortcuts = function(shortcuts)
  {
    var 
    i = 0, 
    shortcut = '', 
    tokens = null, 
    key_id = 0, 
    shift = 0, 
    ctrl = 0, 
    alt = 0,
    is_named_key = false,
    set_modifiers = false;
    
    this._named_shortcuts = {};
    this._char_shortcuts = {};

    for (; shortcut = shortcuts[i]; i++)
    {
      if (!KeyIdentifier.validate_shortcut(shortcut))
        throw "Invalid shortcut " + shortcut;
      tokens = shortcut.split(/[ \-,\+]+/).reverse().
               map(function(t){return t.toLowerCase()});
      shift = tokens.indexOf("shift") != -1;
      ctrl = tokens.indexOf("ctrl") != -1;
      alt = tokens.indexOf("alt") != -1;
      is_named_key = tokens[0].length > 1;
      set_modifiers = false;
      if (is_named_key)
      {
        key_id = this._name_keycode_map[tokens[0]] << 3;
        set_modifiers = true;
      }
      else
      {
        if ((shift || ctrl) && 
            96 < tokens[0].charCodeAt(0) && 
            tokens[0].charCodeAt(0) < 123) 
        {
          key_id = tokens[0].toUpperCase().charCodeAt(0) << 3;
          set_modifiers = true;
        }
        else
          key_id = tokens[0].charCodeAt(0) << 3;
      }
      if (set_modifiers)
      {
        key_id |= ctrl ? 4 : 0;
        key_id |= shift ? 2 : 0;        
        key_id |= alt ? 1 : 0;
      }
      if (is_named_key)
        this._named_shortcuts[key_id] = shortcut;
      else
        this._char_shortcuts[key_id] = shortcut;
    }
  }
  
  this._handle_keypress_bound = function(event)
  {
    if ((this._named_keycodes.indexOf(event.keyCode) != -1 && event.which === 0) ||
        this._named_keycodes_u.indexOf(event.keyCode) != -1)
      this._handle_named_key(event);
    else
      this._handle_char_key(event);
  }.bind(this);

  this._handle_named_key = function(event)
  {
    var key_id = event.keyCode << 3 | 
             (event.ctrlKey ? 4 : 0) | 
             (event.shiftKey ? 2 : 0) | 
             (event.altKey ? 1 : 0);
    if (key_id in this._named_shortcuts)
      callback(this._named_shortcuts[key_id], event);
  };

  this._handle_char_key = function(event)
  {
    var keyCode = event.keyCode;
    // to force a common pattern with the ctrl flag set
    if (event.ctrlKey && (96 < keyCode && keyCode < 123))
      keyCode &= 0x5f;
    var key_id = event.keyCode << 3;
    console.log(keyCode)
    if (64 < keyCode && keyCode < 91)
    {
      key_id |= (event.ctrlKey ? 4 : 0) | 
                (event.shiftKey ? 2 : 0) | 
                (event.altKey ? 1 : 0);
    }
    if (key_id in this._char_shortcuts)
      callback(this._char_shortcuts[key_id], event);
  };

  document.addEventListener('keypress', this._handle_keypress_bound, true);

};

KeyIdentifier.validate_shortcut = function(shortcut)
{
  /**
    * A shortcut has a name or a char, preceeded by maximal three modifiers.
    * Name must be one of 
    *   backspace, tab, enter, escape, space, 
    *   left, up, right, down, 
    *   insert, home, pageup, 
    *   delete, end, pagedown, 
    *   f1 - f12.
    * Char can be any unicode code point.
    * Modifiers are only possible for named shortcuts or for chars a-z.
    * Modifier is one of ctrl, shift, alt.
    * All tokens of a shortcut are case insensitive.
    * Separaters of the shortcut tokens can be a space, a comma, '+' or '-'.
    */

  var tokens = shortcut.split(/[ \-,\+]+/).reverse().
               map(function(t){return t.toLowerCase()});
  if (tokens.length == 0 || tokens.length > 3)
    return false;
  if (tokens.length > 1)
    for (var i = 1; i < tokens.length; i++)
      if (["ctrl", "shift", "alt"].indexOf(tokens[i]) == -1)
        return false;
  if (tokens[0].length == 1)
  {
    var key_code = tokens[0].charCodeAt(0);
    if ((key_code < 65 || (90 < key_code && key_code < 97) || 122 < key_code) &&
       tokens.length > 1)
      return false;
  }
  else if (!(tokens[0] in KeyIdentifier.named_keys))
      return false;
  return true;
};

KeyIdentifier.named_keys =
{
  "backspace": 8, "tab": 9, "enter": 13, "escape": 27, "space": 32, 
  "left": 37, "up": 38, "right": 39, "down": 40, 
  "insert": 45, "home": 36, "page-up": 33, 
  "delete": 46, "end": 35, "page-down": 34,
  "f1": 112, "f2": 113, "f3": 114, "f4": 115, "f5": 116, "f6": 117,
  "f7": 118, "f8": 119, "f9": 120, "f10": 121, "f11": 122, "f12": 123,
};
