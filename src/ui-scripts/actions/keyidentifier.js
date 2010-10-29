var KeyIdentifier = function()
{
  // key id [CTRL][SHIFT][ALT]CHAR|NAME
  this._key_id_map = {};
  this._key_id_map[0x09 << 3] = "TAB";
  this._key_id_map[0x09 << 3 | 2] = "SHIFT_TAB";
  this._key_id_map[0x0D << 3] = "ENTER";
  this._key_id_map[0x0D << 3 | 2] = "SHIFT_ENTER";
  this._key_id_map[0x0D << 3 | 4] = "CTRL_ENTER";
  this._key_id_map[0x1B << 3] = "ESC";
  this._key_id_map[0x20 << 3] = "SPACE";
  this._key_id_map[0x25 << 3] = "LEFT";
  this._key_id_map[0x26 << 3] = "UP";
  this._key_id_map[0x27 << 3] = "RIGHT";
  this._key_id_map[0x28 << 3] = "DOWN";
  this._key_id_map[0x25 << 3 | 2] = "SHIFT_LEFT";
  this._key_id_map[0x26 << 3 | 2] = "SHIFT_UP";
  this._key_id_map[0x27 << 3 | 2] = "SHIFT_RIGHT";
  this._key_id_map[0x28 << 3 | 2] = "SHIFT_DOWN";
  this._key_id_map[0x08 << 3] = "BACKSPACE";
  this._key_id_map[0x08 << 3 | 4] = "CTRL_BACKSPACE";
  this._key_id_map[0x2E << 3] = "DELETE";
  this._key_id_map[0x77 << 3] = "F8";
  this._key_id_map[0x78 << 3] = "F9";
  this._key_id_map[0x79 << 3] = "F10";
  this._key_id_map[0x7A << 3] = "F11";
  this._key_id_map[0x7A << 3 | 2] = "SHIFT_F11";
  this._key_id_map[0x41 << 3 | 4] = "CTRL_A";
  this._key_id_map[0x49 << 3 | 4] = "CTRL_I";
  this._key_id_map[0x53 << 3 | 4 | 2] = "CTRL_SHIFT_S";
  
  this._handle_keypress_bound = (function()
  {
    const
    F8 = 119,
    F9 = 120,
    F10 = 121,
    F11 = 122,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40;

    var keyCode = event.keyCode, key_id = 0;

    switch (keyCode)
    {
      case LEFT:
      case UP:
      case RIGHT:
      case DOWN:
      case F8:
      case F9:
      case F10:
      case F11:
      {
        // in the keypress events the which property for function keys is set to 0
        // this check lets pass e.g. '(' on a AZERTY keyboard
        if (event.which != 0)
          return;
      }
    }
    key_id = keyCode << 3 | 
             (event.ctrlKey ? 4 : 0) | 
             (event.shiftKey ? 2 : 0) | 
             (event.altKey ? 1 : 0);
    if (key_id in this._key_id_map)
      this._broker.dispatch_key_input(this._key_id_map[key_id]);
  }).bind(this);

  this._init = function()
  {
    this._broker = new ActionBroker();
    document.addEventListener('keypress', this._handle_keypress_bound, true);
  }

  this._init();
  
};
