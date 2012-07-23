var KeyIdentifier = function(callback, browser)
{
  /* interface */
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

  // Short cuts are stored in two maps, one for names and one for chars,
  // basically to make the check for a subscribed shortcut easier. Shortcuts
  // are stored in a map. The key for the shortcut is the keyCode shifted
  // by three positions to have a bit flag for ctrl, alt and shift. The
  // modifier flags are only set for named and a-z shortcuts, not for single
  // chars outside a-z, because that would make it impossible to recognize
  // them in a keyboard independent way (e.g. '(' on a AZERTY has no modifier
  // flag).

  this.set_shortcuts = function(shortcuts)
  {
    var ev = null;
    try
    {
      ev = document.createEvent("KeyboardEvent");
    }
    catch(e) {};

    if (ev && ev.hasOwnProperty("key"))
    {
      this._set_shortcuts(shortcuts);
      this._setup(true);
    }
    else
    {
      this._set_shortcuts_old(shortcuts);
      this._setup(false);
    }
  };

  this._set_shortcuts = function(shortcuts)
  {
    this._named_shortcuts = {};
    this._char_shortcuts = {};
    for (var i = 0, shortcut; shortcut = shortcuts[i]; i++)
    {
      if (!KeyIdentifier.validate_shortcut(shortcut))
        throw "Invalid shortcut " + shortcut;

      var tokens = shortcut.split(/[ ,\+]+/).map(function(t)
      {
        t = t.toLowerCase();
        // on Mac Opera cmd and ctrl are switched
        if (t == "cmd")
          t = "ctrl";

        return t;
      });

      var mod_key = ["shift", "ctrl", "alt"/*, "meta"*/].reduce(function(m_key, mod, index)
      {
        var pos = tokens.indexOf(mod);
        if (pos > -1)
        {
          m_key |= Math.pow(2, index);
          tokens.splice(pos, 1);
        }
        return m_key;
      }, 0);

      if (tokens.length !== 1)
        throw "Invalid shortcut " + shortcut;

      var key = tokens[0];
      var key_id = 0;

      if (key.length > 1)
      {
        key_id = this._name_keycode_map[key] << 4 | mod_key;
        this._named_shortcuts[key_id] = shortcut;
      }
      else
      {
        var char_code = key.charCodeAt(0);
        if (this._is_not_alpha(char_code))
          key_id = char_code << 4;
        else
          key_id = key.toUpperCase().charCodeAt(0) << 4 | mod_key;

        this._char_shortcuts[key_id] = shortcut;
      }
    }
  };

  this._is_not_alpha = function(char_code)
  {
    return char_code &&
           // event.char with ctrl key can produce chars in the range 0 - 0x20.
           // They are treated as alpha too.
           ((0x20 <= char_code && char_code <= 0x40) ||
            (0x5B <= char_code && char_code <= 0x60) ||
            (0x7B <= char_code && char_code <= 0x7E));
  };

  this._set_shortcuts_old = function(shortcuts)
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
      tokens = shortcut.split(/[ ,\+]+/).reverse().
               map(function(t){return t.toLowerCase()});
      shift = tokens.indexOf("shift") != -1;
      ctrl = (tokens.indexOf("ctrl") != -1) || (tokens.indexOf("cmd") != -1);
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
        if (96 < tokens[0].charCodeAt(0) && tokens[0].charCodeAt(0) < 123)
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

  // One challenge here is to tell apart f1-f12, arrow keys and insert, delete,
  // home, end, page up, page down from character input. The key codes of
  // these keys collides with unicode code points. In Opera and FF the which
  // property is always set to 0 for them, in Chrome the keyIdentifier event
  // property names these keys with a token. An other challenge are a-z with
  // ctrl or alt modifier set, e.g. Opera is not consistent here between platforms.
  //
  // The general consensus seems to move in the direction to use keypress
  // to detect character input and keydown and keyup for keyCode input.
  // WebKit follows closely that guideline, e.g. a keypress is never dispatch if
  // it wouldn't resolve in a character input.
  //
  // Not all short cuts are subscribable in a platform consistent way, e.g. on
  // a Mac ctrl a goes never to the browser.

  // opera
  this._handle_keydown_bound = function(event)
  {
    var mod_key = ["shift", "ctrl", "alt"/*, "meta"*/].reduce(function(m_key, mod, index)
    {
      return m_key | (event[mod + "Key"] ? Math.pow(2, index) : 0);
    }, 0);

    if (event.key.length > 1)
    {
      var key_id = this._name_keycode_map[event.key] << 4 | mod_key;
      if (key_id in this._named_shortcuts)
        callback(this._named_shortcuts[key_id], event);
    }
    else
    {
      var char_code = event.char && event.char.charCodeAt(0);
      var key_id = this._is_not_alpha(char_code)
                 ? char_code << 4
                 : event.keyCode << 4 | mod_key;
      if (key_id in this._char_shortcuts)
        callback(this._char_shortcuts[key_id], event);
    }
  }.bind(this);

  this._handle_keypress_bound_old = function(event)
  {
    var key_code = event.keyCode;
    if ((this._named_keycodes.indexOf(key_code) != -1 && event.which === 0) ||
        this._named_keycodes_u.indexOf(key_code) != -1)
      this._handle_named_key(event, key_code);
    else
    {
      if ((64 < key_code && key_code < 91) || (96 < key_code && key_code < 123))
        this._handle_a_z(event, key_code);
      else
        this._handle_not_a_z(event, key_code);
    }
  }.bind(this);

  // chrome
  this._handle_keypdown_ch_bound = function(event)
  {
    var key_code = event.keyCode;
    if (event.keyIdentifier.indexOf("U+") == -1 ||
        this._named_keycodes_u.indexOf(key_code) != -1)
      this._handle_named_key(event, key_code);
    else if ((64 < key_code && key_code < 91) || (96 < key_code && key_code < 123))
        this._handle_a_z(event, key_code);

  }.bind(this);

  // chrome
  this._handle_keypress_ch_bound = function(event)
  {
    var key_code = event.keyCode;
    if (!(64 < key_code && key_code < 91) && !(96 < key_code && key_code < 123))
      this._handle_not_a_z(event, key_code);

  }.bind(this);

  // firefox
  this._handle_keypress_ff_bound = function(event)
  {
    var key_code = event.keyCode;
    if ((this._named_keycodes.indexOf(key_code) != -1 && event.which === 0) ||
        this._named_keycodes_u.indexOf(key_code) != -1)
      this._handle_named_key(event, key_code);
    else
    {
      key_code = event.charCode;
      if ((64 < key_code && key_code < 91) || (96 < key_code && key_code < 123))
        this._handle_a_z(event, key_code);
      else
        this._handle_not_a_z(event, key_code);
    }
  }.bind(this);

  this._handle_named_key = function(event, key_code)
  {
    var key_id = event.keyCode << 3 |
             (event.ctrlKey ? 4 : 0) |
             (event.shiftKey ? 2 : 0) |
             (event.altKey ? 1 : 0);
    if (key_id in this._named_shortcuts)
      callback(this._named_shortcuts[key_id], event);
  };

  this._handle_a_z = function(event, key_code)
  {
    key_code &= 0x5f;
    var key_id = key_code << 3 |
                 (event.ctrlKey ? 4 : 0) |
                 (event.shiftKey ? 2 : 0) |
                 (event.altKey ? 1 : 0);

    if (key_id in this._char_shortcuts)
      callback(this._char_shortcuts[key_id], event);
  };

  this._handle_not_a_z = function(event, key_code)
  {
    var key_id = key_code << 3;
    if (key_id in this._char_shortcuts)
      callback(this._char_shortcuts[key_id], event);
  };

  this._setup = function(has_key_support)
  {
    if (!this._is_setup)
    {
      browser || (browser = "opera");
      this._is_setup = true;
      switch (browser)
      {
        case "opera":
          if (has_key_support)
            document.addEventListener('keydown', this._handle_keydown_bound, true);
          else
            document.addEventListener('keypress', this._handle_keypress_bound_old, true);
          break;
        case "chrome":
          document.addEventListener('keydown', this._handle_keypdown_ch_bound, true);
          document.addEventListener('keypress', this._handle_keypress_ch_bound, true);
          break;
        case "firefox":
          document.addEventListener('keypress', this._handle_keypress_ff_bound, true);
          break;
      }
    }
  }

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
    * Modifier is one of ctrl, shift, alt (cmd is treated as ctrl).
    * All tokens of a shortcut are case insensitive.
    * Separaters of the shortcut tokens can be a space, a comma, '+' or '-'.
    */

  var tokens = shortcut.split(/[ ,\+]+/).reverse().map(function(t)
               {
                  t = t.toLowerCase();
                  if (t == "cmd")
                    t = "ctrl";
                  return t;
               });
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
  "backspace": 8,
  "Backspace": 8,
  "tab": 9,
  "Tab": 9,
  "enter": 13,
  "Enter": 13,
  "escape": 27,
  "Esc": 27,
  "esc": 27,
  "space": 32,
  "Spacebar": 32,
  "spacebar": 32,
  "left": 37,
  "Left": 37,
  "up": 38,
  "Up": 38,
  "right": 39,
  "Right": 39,
  "down": 40,
  "Down": 40,
  "insert": 45,
  "Insert": 45,
  "home": 36,
  "Home": 36,
  "page-up": 33,
  "PageUp": 33,
  "pageup": 33,
  "delete": 46,
  "Delete": 46,
  "end": 35,
  "End": 35,
  "page-down": 34,
  "PageDown": 34,
  "pagedown": 34,
  "f1": 112,
  "F1": 112,
  "f2": 113,
  "F2": 113,
  "f3": 114,
  "F3": 114,
  "f4": 115,
  "F4": 115,
  "f5": 116,
  "F5": 116,
  "f6": 117,
  "F6": 117,
  "f7": 118,
  "F7": 118,
  "f8": 119,
  "F8": 119,
  "f9": 120,
  "F9": 120,
  "f10": 121,
  "F10": 121,
  "f11": 122,
  "F11": 122,
  "f12": 123,
  "F12": 123,
};
