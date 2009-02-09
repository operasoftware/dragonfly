/**
  * @constructor 
  */

var ToolbarConfigBase = new function()
{
  var self = this;
  var id_count = 1;
  var ids = {};

  var getId = function()
  {
    return 'toolbar-' + (id_count++).toString();
  }

  this.addContainerId = function(id) // a markup id from a toolbar
  {
    this.container_ids[this.container_ids.length] = id;
  }

  this.removeContainerId = function(id) // a markup id from a toolbar
  {
    var id_c = '', i = 0;
    for( ; ( id_c = this.container_ids[i] ) && id_c != id; i++);
    if( id_c )
    {
      this.container_ids.splice(i, 1);
    }
  }

  this.updateButtons = function()
  {
    var 
    id = '', 
    i = 0, 
    container = null,
    buttons = null,
    button = null,
    j = 0;
    for( ; id = this.container_ids[i]; i++)
    {
      container = document.getElementById(id);
      if( container )
      {
        buttons = container.getElementsByTagName('toolbar-buttons')[0].getElementsByTagName('button');
        for( j = 0; button = buttons[j]; j++)
        {
          button.disabled = this.buttons[j].disabled ? true : false;
        }
      }
    }
  }

  this.getButtonsByHandler = function(handler)
  {
    var buttons = [], i = 0, button = null;
    for( ; button = this.buttons[i]; i++)
    {
      if(button.handler == handler )
      {
        buttons[buttons.length] = button;
      }
    }
    return buttons;
  }

  this.getButtonById = function(id)
  {
    var button = null, i = 0;
    for( ; ( button = this.buttons[i] ) && button.id != id; i++);
    return button || null;
  }

  this.enableButtons = function(/* any number of handlers */)
  {
    var buttons = null, button = null, handler = '', i = 0, j = 0;
    for ( ; handler = arguments[i]; i++ )
    {
      buttons = this.getButtonsByHandler(handler);
      for( j = 0; button = buttons[j]; j++)
      {
        button.disabled = false;
      }
    }
    this.updateButtons();
  }

  this.disableButtons = function(/* any number of handlers */)
  {
    var buttons = null, button = null, handler = '', i = 0, j = 0;
    for ( ; handler = arguments[i]; i++ )
    {
      buttons = this.getButtonsByHandler(handler);
      for( j = 0; button = buttons[j]; j++)
      {
        button.disabled = true;
      }
    }
    this.updateButtons();
  }

  this.setVisibility = function(bool)
  {
    this.__is_visible = bool;
  }

  this.getVisibility = function()
  {
    return this.__is_visible;
  }

  this.init = function(name, optional_button_array, optional_filter_array, optional_special_button_array, optional_custom_button_array)
  {
    ids [ this.id = getId() ] = this;
    this.buttons = optional_button_array || [];
    this.filters = optional_filter_array || [];
    this.specials = optional_special_button_array || [];
    this.customs = optional_custom_button_array || [];
    this.container_ids = [];
    this.__is_visible = true;
    if(!window.toolbars)
    {
      window.toolbars = {};
    }
    window.toolbars[name] = this;
  }

  this.getToolbarById = function(id)
  {
    return ids[id];
  }

  this._delete = function(id)
  {
    delete ids[id];
  }
}

/**
  * @constructor 
  * @extends ToolbarConfigBase
  */

var ToolbarConfig = function(name, optional_button_array, optional_filter_array, optional_special_button_array, optional_custom_button_array)
{
  this.init(name, optional_button_array, optional_filter_array, optional_special_button_array, optional_custom_button_array);
}

ToolbarConfig.prototype = ToolbarConfigBase;
