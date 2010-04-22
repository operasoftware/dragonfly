
// add here the combinations which will be handled
// format shiftKey 0 | 1, ctrlKey 0 | 1, altKey 0 | 1, keyCode
var key_ids = 
{
  TAB: '0009',
  SHIFT_TAB: '1009',
  ENTER: '00013',
  SHIFT_ENTER: '10013',
  CTRL_ENTER: '01013',
  ESC: '00027',
  SPACE: '00032',
  ARROW_LEFT: '00037',
  ARROW_UP: '00038',
  ARROW_RIGHT: '00039',
  ARROW_DOWN: '00040',
  SHIFT_ARROW_LEFT: '10037',
  SHIFT_ARROW_UP: '10038',
  SHIFT_ARROW_RIGHT: '10039',
  SHIFT_ARROW_DOWN: '10040',
  BACKSPACE: '0008',
  CTRL_BACKSPACE: '0108',
  DELETE: '00046',
  F8: '000119',
  F9: '000120',
  F10: '000121',
  F11: '000122',
  SHIFT_F11: '100122',
  CTRL_A: '01065',
  CTRL_I: '01073',
  CTRL_SHIFT_S: '11083'
}

var action_ids =
{
  NAV_NEXT: 'action-nav-next',
  NAV_PREVIOUS: 'action-nav-previous',
  ENTER: 'action-enter',
  SHIFT_ENTER: 'action-shift-enter',
  CTRL_ENTER: 'action-ctrl-enter',
  ESCAPE: 'action-escape',
  NAV_LEFT: 'action-nav-left',
  NAV_UP: 'action-nav-up',
  NAV_RIGHT: 'action-nav-right',
  NAV_DOWN: 'action-nav-down',
  ENABLE_DISABLE: 'action-enable-disable',
  CONTINUE: 'action-continue',
  STEP_OVER: 'action-step-over',
  STEP_INTO: 'action-step-into',
  STEP_OUT: 'action-step-out',
  BACKSPACE: 'action-back-space',
  CTRL_BACKSPACE: 'action-ctrl-back-space',
  CTRL_A: 'action-select-all',
  CTRL_I: 'invert',
  CTRL_SHIFT_S: 'action-df-snapshot'

}

var action_map_win = {};

action_map_win[key_ids.TAB] = action_ids.NAV_NEXT;
action_map_win[key_ids.SHIFT_TAB] = action_ids.NAV_PREVIOUS;
action_map_win[key_ids.ENTER] = action_ids.ENTER;
action_map_win[key_ids.SHIFT_ENTER] = action_ids.SHIFT_ENTER;
action_map_win[key_ids.CTRL_ENTER] = action_ids.CTRL_ENTER;
action_map_win[key_ids.ESC] = action_ids.ESCAPE;
action_map_win[key_ids.ARROW_LEFT] = action_ids.NAV_LEFT;
action_map_win[key_ids.ARROW_UP] = action_ids.NAV_UP;
action_map_win[key_ids.ARROW_RIGHT] = action_ids.NAV_RIGHT;
action_map_win[key_ids.ARROW_DOWN] = action_ids.NAV_DOWN;
action_map_win[key_ids.BACKSPACE] = action_ids.ENABLE_DISABLE;
action_map_win[key_ids.DELETE] = action_ids.ENABLE_DISABLE;
action_map_win[key_ids.F8] = action_ids.CONTINUE;
action_map_win[key_ids.F10] = action_ids.STEP_OVER;
action_map_win[key_ids.F11] = action_ids.STEP_INTO;
action_map_win[key_ids.SHIFT_F11] = action_ids.STEP_OUT;
action_map_win[key_ids.BACKSPACE] = action_ids.BACKSPACE;
action_map_win[key_ids.CTRL_BACKSPACE] = action_ids.CTRL_BACKSPACE;
action_map_win[key_ids.CTRL_A] = action_ids.CTRL_A;
action_map_win[key_ids.CTRL_I] = action_ids.CTRL_I;
action_map_win[key_ids.CTRL_SHIFT_S] = action_ids.CTRL_SHIFT_S;

var action_map = action_map_win;

/**
  * @constructor 
  */

var BaseActions = new function()
{
  this.init = function(id)
  {
    if( !window.actions )
    {
      window.actions = {};
    }
    window.actions[this.id = id] = this;
  }
}

/**
  * @constructor 
  */

var BaseKeyhandler = new function()
{
  var 
  key = '',

  // return true to stop the default action and propagation
  default_handler = function(event, id)
  {
    var _id = '';
    for( _id in action_ids )
    {
      if( action_ids[_id] == id )
      {
        // return false to stop propagation and prevent default action
        return /input|textarea/i.test(event.target.nodeName); 
      }
    }
  };


  for( key in action_map )
  {
    this[action_map[key]] = default_handler;
  }

  for( key in action_ids )
  {
    this[key] = action_ids[key];
  }

  

  this.focus = function(container)
  {

  }

  this.blur = function()
  {

  }

  this.onclick = function(event)
  {
    return true;
  };

  this[this.CTRL_I] = function(event, action_id)
  {
    hostspotlighter.invertColors();
  }
  //BaseKeyhandler["action-df-snapshot"]()
  this[this.CTRL_SHIFT_S] = function(event, action_id)
  {
    if(window.client.scope_proxy == "dragonkeeper")
    {
      var style = document.documentElement.style;
      style.cssText = "width:" + window.innerWidth + "px;height:" + window.innerHeight + "px;";
      var snapshot = new XMLSerializer().serializeToString(document);
      var title = prompt("file name for the snapshot");
      if(title)
      {
        title = title.replace(/ /g, '-');
        window.proxy.POST("/snapshot", title + "\r\n" + snapshot);
      }
      //window.open("data:text/plain," + encodeURIComponent(new XMLSerializer().serializeToString(document)))
      style.cssText = "";
    }
  }

  this.init = function(id)
  {
    if( !window.keyhandlers )
    {
      window.keyhandlers = {};
    }
    window.keyhandlers[this.id = id] = this;
  }
  

}

/**
  * @constructor 
  */

var BaseEditKeyhandler = new function()
{
  var 
  key = '',

  // return false to stop the default action and propagation
  default_handler = function(event, id)
  {
    var _id = '';
    for( _id in action_ids )
    {
      if( action_ids[_id] == id )
      {
        return true; // perform default action
      }
    }
  };


  for( key in action_map )
  {
    this[action_map[key]] = default_handler;
  }

  for( key in action_ids )
  {
    this[key] = action_ids[key];
  }

  

  this.focus = function(container)
  {

  }

  this.blur = function()
  {

  }

  this.onclick = function(event)
  {
    return true;
  };

  this.init = function(id)
  {
    if( !window.edit_keyhandlers )
    {
      window.edit_keyhandlers = {};
    }
    window.edit_keyhandlers[this.id = id] = this;
  }
  

}

/**
  * @constructor 
  * @extends BaseKeyhandler
  */

var DefaultKeyhandler = function(id)
{
  this.init(id);
};

DefaultKeyhandler.prototype = BaseKeyhandler;

new DefaultKeyhandler('default_keyhandler');

/**
  * @constructor 
  */

var key_identifier = new function()
{
  var self = this;

  var __container = null;
 
  const 
  TAB = 9,
  ENTER = 13,
  ESC = 27,
  SPACE = 32,
  ARROW_LEFT = 37,
  ARROW_UP = 38,
  ARROW_RIGHT = 39,
  ARROW_DOWN = 40,
  BACKSPACE = 8,
  DELETE = 46,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  A = 65,
  I = 73,
  S = 83;

  var key_handler_ids = {}, id = '';

  var __key_handler = null;

  var __current_view_id = null;

  var empty_keyhandler = new function()
  {
    var 
    key = '',

    // return false to stop the default action and propagation
    empty_handler = function(event, id)
    {
      return /input|textarea|button/i.test(event.target.nodeName);
    };


    for( key in action_map )
    {
      this[action_map[key]] = empty_handler;
    }

    this[action_map[key_ids.CTRL_I]] = function(event, action_id)
    {
      hostspotlighter.invertColors();
    }

    this.focus = function(container) {};


    this.blur = function() {};

    this.setTarget = function(){};

    this.onclick = function(event){return true;};


  }

  for( id in key_ids )
  {
    key_handler_ids[key_ids[id]] = true;
  }

  __key_handler = empty_keyhandler;

  this.setKeyHandler = function(key_handler)
  {
    __key_handler = key_handler;
  }

  this.setModeEdit = function(actions)
  {
    if(__key_handler.id == actions.id && window.edit_keyhandlers && edit_keyhandlers[actions.id] )
    {
      __key_handler = edit_keyhandlers[actions.id];
      __container.addClass('edit-mode');
      messages.post('action-mode-changed', {mode: 'edit', id: actions.id});
    }
  }

  this.setModeDefault = function(actions)
  {
    if( __key_handler.id == actions.id  )
    {
      __key_handler = keyhandlers[actions.id];
      __container.removeClass('edit-mode');
      messages.post('action-mode-changed', {mode: 'default', id: actions.id});
    }
  }

  this.handle = function(event)
  {
    var 
    keyCode = event.keyCode, 
    key_id = '',
    action_id = 0;
    // TODO switch for the key_id
    switch(keyCode)
    {
      case ARROW_LEFT:
      case ARROW_UP:
      case ARROW_RIGHT:
      case ARROW_DOWN:
      case F8:
      case F9:
      case F10:
      case F11:
      {
        // in the keypress events the which property for function keys is set to 0 
        // this check lets pass e.g. '(' on a AZERTY keyboard
        if( event.which != 0 /* && event.which < 0xE000 */ )
        {
          break;
        }
      }
      case TAB:
      case ENTER:
      case ESC:
      case SPACE:
      case BACKSPACE:
      case DELETE:
      case A:
      case I:
      case S:
      {
        key_id = ( event.shiftKey ? '1' : '0' ) +
            ( event.ctrlKey ? '1' : '0' ) +
            ( event.altKey ? '1' : '0' ) +
            keyCode.toString();
        if( key_id in action_map 
            && !__key_handler[action_id = action_map[key_id]](event, action_id) )
        {
          event.preventDefault();
          event.stopPropagation();
        }
        
        break;
      }
    }
  }

  var clear_current_handler = function()
  {
    if(__key_handler)
    {
      __key_handler.blur();
    }
    if( __container && __container.hasClass('edit-mode') )
    {
      __container.removeClass('edit-mode');
    }
    __current_view_id = '';
    __container = null;
    __key_handler = empty_keyhandler;
  }

  this.setView = function(event)
  {
    if( !( __key_handler && __key_handler.onclick(event) === false ) )
    {
      var container = event.target;
      while( container && !/^(?:top-)?(?:container|toolbar|tabs)$/i.test(container.nodeName) 
        && ( container = container.parentElement ) );
      
      if( container )
      {
        switch (container.nodeName.toLowerCase())
        {
          case 'container':
          {
            var ui_obj = UIBase.getUIById(container.getAttribute('ui-id'));
            if( ui_obj && ui_obj.view_id != __current_view_id )
            {
              clear_current_handler();
              // TODO check if it has already focus
              __key_handler = keyhandlers[__current_view_id = ui_obj.view_id] || empty_keyhandler;
              __key_handler.focus(event, container);
              __container = container;

            }
            break;
          }
          // TODO set according key handler, e.g. toolbar, tab
          default:
          {
            clear_current_handler();
          }
        }
      }
      else
      {
        clear_current_handler();
      }
    }
  }
  document.addEventListener('keypress', this.handle, true);
  document.addEventListener('click', this.setView, true);
  
};

