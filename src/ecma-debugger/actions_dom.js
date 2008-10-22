var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
  * @constructor 
  * @extends BaseActions
  */

cls.DOMInspectorActions = function(id)
{
  var self = this;

  this.__active_container = null;
  this.__target = null;



  this.editor = null;
  this.editors = 
  {
    "dom-attr-text-editor": new DOMAttrAndTextEditor(),
    "dom-markup-editor": new DOMMarkupEditor()
  };

  this.set_editor = function(type)
  {
    if( this.editor )
    {
      this.editor.submit()
    }
    if( !this.editor || this.editor.type != type )
    {
      this.editor = this.editors[type];
    }
  }


  /*
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
  */
  this.setSelected = function(new_target)
  {
    if(new_target)
    {
      self.__target = new_target;
      /*
      TODO set target here
      if( self.__target )
      {
        self.__target.removeClass('selected');
      }       
      ( self.__target = new_target ).addClass('selected');
      self.__target.scrollSoftIntoView();
      */
    }
  }
  /*
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


  {
    "dom-attr-text-editor": new DOMAttrAndTextEditor(),
    "dom-markup-editor":


  */
  this.editDOM = function(event, target)
  {
    
    switch(event.target.nodeName)
    {
      case 'key':
      case 'value':
      case 'text':
      {
        event.preventDefault();
        event.stopPropagation();
        
        key_identifier.setModeEdit(self);
        self.setSelected(event.target.parentNode);
        self.set_editor("dom-attr-text-editor");
        self.editor.edit(event, event.target);
        
        break;
      }
      case 'node':
      {
        event.preventDefault();
        event.stopPropagation();
        /*
        if(event.target.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target);
          self.editor.edit(event);
        }
        */
        // execute property click action
        break;
      }
    }
  }
  /*
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


  */

  this.escape_edit_mode = function(event, action_id)
  {
    var navigation_target = this.editor.cancel();
    if(!navigation_target)
    {
      // TODO get a valid navigation target
    }
    else
    {
      // TODO set the return value as navigation target
    }
    key_identifier.setModeDefault(self);
    return false;
  }

  this.init(id);

  var onViewCreated = function(msg)
  {
    if(msg.id == "dom" )
    {
      // self.resetTarget();
    }
  }
  messages.addListener('view-created', onViewCreated)


};

cls.DOMInspectorActions.prototype = BaseActions;

new cls.DOMInspectorActions('dom'); // the view id


/**
  * @constructor 
  * @extends BaseKeyhandler
  */

cls.DOMInspectorKeyhandler = function(id)
{

  var __actions = actions[id]
  
  /*
  this[this.NAV_LEFT] = this[this.NAV_UP] = __actions.moveFocusUp;

  this[this.NAV_RIGHT] = this[this.NAV_DOWN] = __actions.moveFocusDown;
  
  this[this.ENTER] = function(event, action_id)
  {
    __actions.target_enter(event, action_id);
  }


  this.focus = __actions.setActiveContainer;

  this.blur = __actions.clearActiveContainer;
  */


  this.init(id);
};

cls.DOMInspectorKeyhandler.prototype = BaseKeyhandler;

new cls.DOMInspectorKeyhandler('dom');

/**
  * @constructor 
  * @extends BaseEditKeyhandler
  */

cls.DOMInspectorEditKeyhandler = function(id)
{

  var __actions = actions[id]

  /*
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
  */

  this[this.ESCAPE] = function(event, action_id)
  {
    __actions.escape_edit_mode(event, action_id);
  }

  this.blur = function(event)
  {
    if( __actions.editor )
    {
      __actions.editor.submit();
    }
  }

  this.onclick = function(event)
  {
    if( __actions.editor )
    {
      __actions.editor.onclick(event);
    }
  }

  this.init(id);
};

cls.DOMInspectorEditKeyhandler.prototype = BaseEditKeyhandler;

new cls.DOMInspectorEditKeyhandler('dom');



eventHandlers.dblclick['edit-dom'] = actions['dom'].editDOM;