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
        buttons = container.getElementsByTagName('toolbar-buttons')[0].getElementsByClassName('ui-button');
        for( j = 0; button = buttons[j]; j++)
        {
          this.buttons[j].disabled ?
            button.setAttribute("disabled", "") :
            button.removeAttribute("disabled");
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

  this.init = function(name_or_config_object, 
                       button_array, 
                       filter_array, 
                       special_button_array, 
                       custom_button_array)
  {
    ids [ this.id = getId() ] = this;
    if (typeof name_or_config_object === "object")
    {
      var name = name_or_config_object.view;
      this.groups = name_or_config_object.groups;
      // Add a plain button array to support deactivating etc.,
      // initialize Switches and SingleSelect objects 
      this.buttons = [];
      for (var i = 0, group; group = this.groups[i]; i++)
      {
        if (group.type !== "input" && group.items)
          this.buttons = this.buttons.concat(group.items);

        // inititalize switches here
        if (group.type === "switch")
        {
          var keys = group.items.map(function(_switch){return _switch.key});
          new Switches(this.id, keys);
        }
        else if (group.type === "single-select")
        {
          var values = group.items.map(function(button){return button.value});
          new SingleSelect(name, group.name, values, group.default_value || values[0], group.allow_multiple_select);
        }
        else if (group.type === "input")
        {
          filter_array = filter_array || [];
          for (var k = 0, search; search = group.items[k]; k++)
            filter_array.push(search);
        }
      }
    }
    else
    {
      var name = name_or_config_object;
      this.buttons = button_array || [];
      this.groups = [{items: this.buttons}];
    }
    this.filters = filter_array || [];
    this.specials = special_button_array || [];
    this.customs = custom_button_array || [];
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

var ToolbarConfig = function(name_or_config_object, 
                             button_array, 
                             filter_array, 
                             special_button_array, 
                             custom_button_array)
{
  this.init(name_or_config_object, 
            button_array, 
            filter_array, 
            special_button_array, 
            custom_button_array);
}

ToolbarConfig.prototype = ToolbarConfigBase;
