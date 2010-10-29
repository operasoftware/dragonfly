var KeyIdentifier = function()
{
  this._key_id_map = {};
  
  this._key_name_map = 
  {
    "TAB": 9, "ENTER": 13 "ESCAPE": 27, "SPACE": 32, "BACKSPACE": 8,
    "LEFT": 37, "UP": 38, "RIGHT": 39, "DOWN": 40, "DELETE": 46,
    "F1": 112, "F2": 113, "F3": 114, "F4": 115, "F5": 116, "F6": 117,
    "F7": 118, "F8": 119, "F9": 120, "F10": 121, "F11": 122, "F12": 123,
  };
  
  this._function_keys = 
  [
    37, 38, 39, 40, 46, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
  ];
  
  this._update_key_id_map = function(shortcuts)
  {
    var 
    i = 0, 
    shortcut = '', 
    tokens = null, 
    key_id = 0, 
    shift = 0, 
    ctrl = 0, 
    alt = 0;
    
    this._key_id_map = {};
    for (; shortcut = shortcuts[i]; i++)
    {
      tokens = shortcut.split('_').reverse();
      shift = tokens.indexOf("SHIFT") == -1 ? 0 : 1;
      ctrl = tokens.indexOf("CTRL") == -1 ? 0 : 1;
      alt = tokens.indexOf("ALT") == -1 ? 0 : 1;
      if (tokens[0].length == 1)
      {
        if (shift || ctrl)
          key_id = tokens[0].toUpperCase().charCodeAt(0) << 3;
        else
          key_id = tokens[0].charCodeAt(0) << 3;
      }
      else if (tokens[0] in this._key_name_map)
          key_id = this._key_name_map[tokens[0]] << 3;
      else
          throw "Missing name in key_name_map in KeyIdentifier: " + tokens[0];
      if (ctrl)
          key_id |= 4;
      if (shift)
          key_id |= 2;        
      if (alt)
          key_id |= 1;
      this._key_id_map[key_id] = shortcut;
    }
  }
  
  this._handle_keypress_bound = (function(event)
  {
    var keyCode = event.keyCode;
    if (this._function_keys.indexOf(keyCode) != -1 && event.which != 0)
      return;
    var key_id = keyCode << 3 | 
             (event.ctrlKey ? 4 : 0) | 
             (event.shiftKey ? 2 : 0) | 
             (event.altKey ? 1 : 0);
    if (key_id in this._key_id_map)
      this._broker.dispatch_key_input(this._key_id_map[key_id], event);
  }).bind(this);

  this._init = function()
  {
    this._broker = new ActionBroker();
    this._update_key_id_map(this._broker.get_short_cuts());
    document.addEventListener('keypress', this._handle_keypress_bound, true);
  }

  this._init();
  
};
