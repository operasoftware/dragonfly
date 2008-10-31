
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
  SHIFT_F11: '100122'
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
  CTRL_BACKSPACE: 'action-ctrl-back-space'
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
        // opera.postError('action: ' + _id);
        return false; // prevent default
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

  };

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
       // opera.postError('action: ' + _id);
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
  F11 = 122;

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
      return /input|textarea/i.test(event.target.nodeName);
    };


    for( key in action_map )
    {
      this[action_map[key]] = empty_handler;
    }

    this.focus = function(container) {};


    this.blur = function() {};

    this.setTarget = function(){};

    this.onclick = function(event){};


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
    }
  }

  this.setModeDefault = function(actions)
  {
    if( __key_handler.id == actions.id  )
    {
      __key_handler = keyhandlers[actions.id];
      __container.removeClass('edit-mode');
    }
  }

  this.handle = function(event)
  {
   
    var 
    keyCode = event.keyCode, 
    key_id = '',
    action_id = 0;

    switch(keyCode)
    {
      case TAB:
      case ENTER:
      case ESC:
      case SPACE:
      case ARROW_LEFT:
      case ARROW_UP:
      case ARROW_RIGHT:
      case ARROW_DOWN:
      case BACKSPACE:
      case DELETE:
      {
        key_id = ( event.shiftKey ? '1' : '0' ) +
            ( event.ctrlKey ? '1' : '0' ) +
            ( event.altKey ? '1' : '0' ) +
            keyCode.toString();
        // opera.postError('key handler: ' + key_id +' '+ (key_id in action_map) +' '+__key_handler[action_id = action_map[key_id]])
        if( key_id in action_map 
            && !__key_handler[action_id = action_map[key_id]](event, action_id) )
        {
          event.preventDefault();
          event.stopPropagation();
        }
        
        break;
      }
      case F8:
      case F9:
      case F10:
      case F11:
      {
        if( !event.which)
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
    
    var container = event.target;
    while( container && !/^(?:top-)?(?:container|toolbar|tabs)$/.test(container.nodeName) 
      && ( container = container.parentElement ) );
    
    if( container )
    {
      switch (container.nodeName)
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
          else if( __key_handler )
          {
            __key_handler.onclick(event);
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
  document.addEventListener('keypress', this.handle, true);
  document.addEventListener('click', this.setView, true);
  
};

var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
  * @constructor 
  * @extends BaseActions
  */

cls.CSSInspectorActions = function(id)
{
  var self = this;

  this.__active_container = null;
  this.__target = null;



  this.editor = new Editor();

  this.getFirstTarget = function()
  {
    return self.__active_container && self.__active_container.getElementsByTagName('styles')[1].getElementsByTagName('property')[0];
  }

  this.clearSelected = function()
  {
    if( self.__target )
    {
      self.__target.removeClass('selected');
    }
  }

  this.setSelected = function(new_target)
  {
    if(new_target)
    {
      if( self.__target )
      {
        self.__target.removeClass('selected');
      }       
      ( self.__target = new_target ).addClass('selected');
      self.__target.scrollSoftIntoView();
    }
  }

  this.resetTarget = function()
  {
    if( self.__active_container && self.__target && !self.__active_container.parentNode )
    {
      var new_container = document.getElementById(self.__active_container.id);
      if(new_container)
      {
        var 
        targets = self.__active_container.getElementsByTagName(self.__target.nodeName),
        target = null, 
        i = 0;
        for( ; ( target = targets[i] ) && target != self.__target; i++ );
        if( target && ( target = new_container.getElementsByTagName(self.__target.nodeName)[i] ) )
        {
          self.__active_container = new_container;
          self.setSelected(target);
        }
      }
    }
  }

  this.moveFocusUp = function(event, target)
  {
    if( self.__target )
    {
      self.setSelected( self.__target.getPreviousWithFilter( self.__active_container,
        self.__target.nodeName == 'header' && self.__target.parentElement.getAttribute('handler') 
        ? nav_filter.header 
        : nav_filter._default ) );
    }
    else
    {
      opera.postError('keyboard_handler: no target to move');
    }
  }

  var nav_filter = 
  {
    _default: function(ele)
    {
      return ( ( ele.nodeName == 'property' && ele.parentElement.hasAttribute('rule-id') )
               || ele.nodeName == 'header' 
               || ele.getAttribute('handler') == 'display-rule-in-stylesheet' );
    },
    header: function(ele)
    {
      return ele.nodeName == 'header';
    },
    property_editable: function(ele)
    {
      return ele.nodeName == 'property' && ele.parentElement.hasAttribute('rule-id');
    }
  }

  this.moveFocusDown = function(event, target)
  {
    if( self.__target )
    {
      self.setSelected( self.__target.getNextWithFilter( self.__active_container,
        self.__target.nodeName == 'header' && !self.__target.parentElement.getAttribute('handler') 
        ? nav_filter.header 
        : nav_filter._default ) );
    }
    else
    {
      opera.postError('keyboard_handler: no target to move');
    }
  }

  this.setActiveContainer = function(event, container)
  {
    self.__active_container = container;
    if ( !self.__target || !self.__target.parentElement )
    {
      self.__target = self.getFirstTarget()
    }
    if( self.__target && !self.__target.hasClass('selected') )
    {
      self.setSelected(self.__target);
    }

  }

  this.clearActiveContainer = function()
  {
    self.clearSelected();
  }

  this.editCSS = function(event, target)
  {
    var cat = event.target;
    
    switch(event.target.nodeName)
    {
      case 'key':
      case 'value':
      {
        
        if(event.target.parentElement.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target.parentNode);
          self.editor.edit(event, event.target.parentNode);
        }
        break;
      }
      case 'property':
      {
        if(event.target.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target);
          self.editor.edit(event);
        }
        // execute property click action
        break;
      }
    }
  }

  this['css-toggle-category'] = function(event, target)
  {
    if(/header/.test(target.nodeName))
    {
      target = target.firstChild;
    }
    var cat = target.getAttribute('cat-id'), value = target.hasClass('unfolded');
    var cat_container = target.parentNode.parentNode;
    if( value )
    {
      target.removeClass('unfolded');
      cat_container.removeClass('unfolded');
      var styles = cat_container.getElementsByTagName('styles')[0];
      if( styles )
      {
        styles.innerHTML = "";
      }
    }
    else
    {
      target.addClass('unfolded');
      cat_container.addClass('unfolded');
    }
    self.setSelected(target.parentNode);
    elementStyle.setUnfoldedCat( cat , !value);
    settings['css-inspector'].set(cat, !value);
  }

  this['display-rule-in-stylesheet'] = function(event, target)
  {
    var index = parseInt(target.getAttribute('index'));
    var rt_id = target.getAttribute('rt-id');
    var rule_id = target.parentNode.getAttribute('rule-id');
    // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
    // handleGetRulesWithIndex in stylesheets will 
    // set for this reason __call_count on the event object
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if(rules)
    {
      self.setSelected(target);
      stylesheets.setSelectedSheet(rt_id, index, rules, rule_id);
      topCell.showView(views.stylesheets.id);
    }
  }
  
  this.target_enter = function(event, action_id)
  {
    if(this.__target)
    {
      this.__target.releaseEvent('click');
    }
  }


  this.nav_previous_edit_mode = function(event, action_id)
  {
    if( !this.editor.nav_previous(event, action_id) )
    {
      var new_target = 
        this.__target.getPreviousWithFilter( this.__active_container, nav_filter.property_editable );
      if(new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusLastToken();
      }
    }

    // to stop default action
    return false;
  }

  this.nav_next_edit_mode = function(event, action_id)
  {
    if( !this.editor.nav_next(event, action_id) )
    {
      var new_target = 
        this.__target.getNextWithFilter( this.__active_container, nav_filter.property_editable );
      if(new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusFirstToken();
      }
    }


    // to stop default action
    return false;
  }

  this.autocomplete = function(event, action_id)
  {
    this.editor.autocomplete(event, action_id);
    return false;
  }

  this.escape_edit_mode = function(event, action_id)
  {
    
    if(!this.editor.escape())
    {
      var cur_target = this.__target;
      this.moveFocusUp();
      cur_target.parentElement.removeChild(cur_target);
    }
    key_identifier.setModeDefault(self);

    return false;
  }

  this.blur_edit_mode = function()
  {
    this.escape_edit_mode();
    this.clearActiveContainer();
  }

  this.enter_edit_mode = function(event, action_id)
  {
    if( !this.editor.enter(event, action_id) )
    {
      key_identifier.setModeDefault(self);
      if( !this.__target.textContent )
      {
        var cur_target = this.__target;
        this.moveFocusUp();
        cur_target.parentElement.removeChild(cur_target);
      }
    }
    return false;
  }




  this.init(id);

  var onViewCreated = function(msg)
  {
    if(msg.id == "css-inspector" )
    {
      self.resetTarget();
    }
  }
  messages.addListener('view-created', onViewCreated)


};

cls.CSSInspectorActions.prototype = BaseActions;

new cls.CSSInspectorActions('css-inspector');


/**
  * @constructor 
  * @extends BaseKeyhandler
  */

cls.CSSInspectorKeyhandler = function(id)
{

  var __actions = actions[id]

  this[this.NAV_LEFT] = this[this.NAV_UP] = __actions.moveFocusUp;

  this[this.NAV_RIGHT] = this[this.NAV_DOWN] = __actions.moveFocusDown;
  
  this[this.ENTER] = function(event, action_id)
  {
    __actions.target_enter(event, action_id);
  }


  this.focus = __actions.setActiveContainer;/*function(event, container)
  {
    __actions.setActiveContainer(container);
    //opera.postError(event.type);
    /*
    if( !__actions.__target )
    {
      __actions.setSelected(__actions.getFirstTarget());
    }
    */ /*
  }*/

  this.blur = __actions.clearActiveContainer;

  this.init(id);
};

cls.CSSInspectorKeyhandler.prototype = BaseKeyhandler;

new cls.CSSInspectorKeyhandler('css-inspector');

/**
  * @constructor 
  * @extends BaseEditKeyhandler
  */

cls.CSSInspectorEditKeyhandler = function(id)
{

  var __actions = actions[id]


  this[this.NAV_UP] = this[this.NAV_DOWN] = function(event, action_id)
  {
    __actions.autocomplete(event, action_id);
  }

  this[this.NAV_NEXT] = function(event, action_id)
  {
    __actions.nav_next_edit_mode(event, action_id);
  }

  this[this.NAV_PREVIOUS] = function(event, action_id)
  {
    __actions.nav_previous_edit_mode(event, action_id);
  }

  this[this.ESCAPE] = function(event, action_id)
  {
    __actions.escape_edit_mode(event, action_id);
  }

  this[this.ENTER] = function(event, action_id)
  {
    __actions.enter_edit_mode(event, action_id);
  }

  this.focus = __actions.test;

  this.blur = function()
  {
    __actions.blur_edit_mode();
  }

  this.init(id);
};

cls.CSSInspectorEditKeyhandler.prototype = BaseEditKeyhandler;

new cls.CSSInspectorEditKeyhandler('css-inspector');


eventHandlers.click['edit-css'] = actions['css-inspector'].editCSS;
eventHandlers.click['css-toggle-category'] = actions['css-inspector']['css-toggle-category'];
eventHandlers.click['display-rule-in-stylesheet'] = actions['css-inspector']['display-rule-in-stylesheet'];






