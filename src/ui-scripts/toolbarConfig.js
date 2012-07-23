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
    if (!this.container_ids.contains(id))
      this.container_ids.push(id);
  }

  this.removeContainerId = function(id) // a markup id from a toolbar
  {
    for (var id_c = "", i = 0; id_c = this.container_ids[i]; i++)
    {
      if (id_c == id)
      {
        this.container_ids.splice(i, 1);
        break;
      }
    }
  };

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
          button.title = this.buttons[j].title;
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

  this.set_button_title = function(handler, title)
  {
    var buttons = this.getButtonsByHandler(handler);
    for (var i = 0; button = buttons[i]; i++)
    {
      button.title = title;
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

  this.enable = function()
  {
    for (var i = 0, id; id = this.container_ids[i]; i++)
    {
      var toolbar = document.getElementById(id);
      if (toolbar)
      {
        var overlay = toolbar.querySelector(".disabled-toolbar-overlay");
        if (overlay)
          toolbar.removeChild(overlay);
      }
    }
  };

  this.disable = function()
  {
    for (var i = 0, id; id = this.container_ids[i]; i++)
    {
      var toolbar = document.getElementById(id);
      if (toolbar)
      {
        var overlay = toolbar.querySelector(".disabled-toolbar-overlay");
        if (!overlay)
          toolbar.render(["div", "class", "disabled-toolbar-overlay"]);
      }
    }
  };

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
      this.filters = [];
      for (var i = 0, group; group = this.groups[i]; i++)
      {
        if (group.type !== UI.TYPE_INPUT && group.items)
          this.buttons = this.buttons.concat(group.items);

        // inititalize switches here
        if (group.type === UI.TYPE_SWITCH)
        {
          var keys = group.items.map(function(switch_) { return switch_.key } );
          new Switches(this.id, keys);
        }
        else if (group.type === UI.TYPE_SINGLE_SELECT)
        {
          var values = group.items.map(function(button) { return button.value } );
          new SingleSelect(name, group.name, values, group.default_value || values[0], group.allow_multiple_select);
        }
        else if (group.type === UI.TYPE_INPUT)
        {
          for (var k = 0, search; search = group.items[k]; k++)
            this.filters.push(search);
        }
        // Nothing needs to be initialized for UI.TYPE_SWITCH_CUSTOM_HANDLER.
        // The buttons are added to this.buttons, the group.handler is added in ui-templates.js
      }
    }
    else
    {
      var name = name_or_config_object;
      this.buttons = button_array || [];
      this.groups = [{items: this.buttons}];
      this.filters = filter_array || [];
      this.specials = special_button_array || [];
      this.customs = custom_button_array || [];
    }
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

  /* config_object
    {
      view: "view_id" // of the view this toolbar belongs to,
      groups: // list of groups that will be separate visually
      [
        {
          type: one of "buttons", "switch", "single-select" or "input".
          items: // list of config objects of buttons, switches etc.
          [
          ]
        }
      ]
    }
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
