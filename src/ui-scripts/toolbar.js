/**
  * @constructor
  * @extends UIBase
  */

var ToolbarBase = function()
{
  this.type = 'toolbar';
  this.default_height = 0;
  this.height = 0;
  this.top_border = 0;
  this.bottom_border = 1;
  this.offsetHeight = 0;

  this._super_update_style = this.update_style;

  this.update_style = function(style)
  {
    this._super_update_style(style);
    if (this.height && style.display != "block")
      style.display = "block";
    if (!this.height && style.display != "none")
      style.display = "none";
  }

  this.getTopPosition = function()
  {
    return this.cell.top + (this.cell.tab ? this.cell.tab.offsetHeight : 0);
  };

  this.getBottomPosition = function()
  {
    return this.__is_visible ? this.getTopPosition() + this.offsetHeight : 0;
  }

  this.get_control = function(handler, handler_name)
  {
    handler_name || (handler_name = 'handler');
    var toolbar = this.getElement();
    if(toolbar)
    {
      var all = toolbar.getElementsByTagName('*'), control = null, i = 0;
      for (; control = all[i]; i++)
      {
        if (control.getAttribute(handler_name)  == handler)
        {
          return control;
        }
      }
    }
    return null;
  }

  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    // set css properties

    if(!this.default_height)
    {
      this.setCSSProperties()
    }

    dim = this.getTopPosition();
    if( dim != this.top)
    {
      this.is_dirty = true;
      this.top = dim;
    }

    dim = this.cell.left;
    if( dim != this.left)
    {
      this.is_dirty = true;
      this.left = dim;
    }

    dim = this.cell.width - this.horizontal_border_padding;
    if( dim != this.width)
    {
      this.is_dirty = true;
      this.width = dim;
    }
    dim = ( this.__is_visible  && (
            this.buttons.length
            || this.switches && this.switches.length
            || this.filters.length
            || this.specials.length
            || this.customs.length ) ) ? this.default_height : 0;

    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
    }

    this.update(force_redraw)

  }

  this.update_sub_class = function()
  {
    var toolbar = document.getElementById(this.type + '-to-' + this.cell.id);
    if( toolbar )
    {
      var cst_select = toolbar.getElementsByTagName('cst-select')[0];
      if( cst_select )
      {
        var
        width = this.width,
        filter = toolbar.getElementsByTagName('filter')[0] ||
                 toolbar.getElementsByTagName('toolbar-search')[0],
        previousEle = cst_select.previousElementSibling;

        if( filter )
        {
          var filter_style = window.getComputedStyle(filter, null);
          var margin = parseInt(filter_style.marginLeft) +
                       parseInt(filter_style.marginRight);
          width -= filter.offsetWidth + margin;
        }

        if( previousEle )
        {
          width -= (previousEle.offsetLeft + previousEle.offsetWidth) - this.left_border_padding;
        }

        cst_select.style.width = (width - defaults['cst-select-margin-border-padding']) + 'px';
      }
    }
  }

  this.setVisibility = function(bool)
  {
    this.__is_visible = bool;
    if(toolbars[this.__view_id])
    {
      toolbars[this.__view_id].setVisibility(bool);
    }
  }

  this.setup = function(view_id)
  {
    var toolbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    toolbar.innerHTML ='';
    this.create_toolbar_content(view_id, toolbar)
  }

  // belongs in ToolbarConfigBase
  this.create_toolbar_content = function(view_id, toolbar)
  {
    this.filters = toolbars[view_id] && toolbars[view_id].filters || [];
    this.buttons = toolbars[view_id] && toolbars[view_id].buttons || [];
    this.groups = toolbars[view_id] && toolbars[view_id].groups || [];
    this.switches = switches[view_id] && switches[view_id].keys || [];
    this.single_selects = single_selects[view_id];
    this.toolbar_settings = window.toolbar_settings && window.toolbar_settings[view_id] || null;
    this.specials = toolbars[view_id] && toolbars[view_id].specials || [];
    this.customs = toolbars[view_id] && toolbars[view_id].customs || [];
    this.__view_id = view_id;

    if (toolbars[view_id])
      this.__is_visible = toolbars[view_id].getVisibility();

    var search = this.filters.length && UI.get_instance().get_search(view_id);
    if (this.__is_visible)
    {
      if (this.filters.length)
      {
        toolbar.render(templates.filters(this.filters));
      }
      if (search)
      {
        toolbar.render(templates.search_button(search));
      }
      if (this.groups.length)
      {
        var group_templates = [];
        for (var i = 0, group; group = this.groups[i]; i++)
        {
          var button_templates = [];
          // The templated will be collected in button_templates, to be then passed to
          // another template function. That is because a button can have a .template member
          // which defines a custom template
          if (group.items && group.type !== UI.TYPE_INPUT)
          {
            var current_value = null;
            for (var j = 0, button; button = group.items[j]; j++)
            {
              if (group.type === UI.TYPE_SINGLE_SELECT)
              {
                var values = window.single_selects;
                values = (values = values[view_id]) && (values = values[group.name]) && (values = values.values);
                button_templates.push(templates.single_select_button(button, values));
              }
              else if (group.type === UI.TYPE_SWITCH || group.type === UI.TYPE_SWITCH_CUSTOM_HANDLER)
              {
                button_templates.push(templates._switch(button.key));
              }
              else if (button.template)
              {
                button_templates.push(button.template(views[view_id]));
              }
              else
              {
                button_templates.push(templates.toolbar_button(button));
              }
            }
            group_templates.push(templates.toolbar_group_wrapper(button_templates, group, view_id));
          }
        }
        toolbar.render(group_templates);
      }
      if(this.switches.length) // the following is legacy support
      {
        toolbar.render(templates.switches(this.switches));
      }
      if(this.toolbar_settings)
      {
        toolbar.render(templates.toolbar_settings(this.toolbar_settings));
      }
      if(this.specials.length)
      {
        toolbar.render(templates.buttons(this.specials));
      }
      if(this.customs.length)
      {
        var custom = null, i = 0;
        for( ; custom = this.customs[i]; i++)
        {
          toolbar.render(custom.template(views[view_id]));
        }
      }

      if (!window.views[view_id].is_enabled && toolbars[view_id])
        toolbars[view_id].disable();
    }
  }

  this.get_filters = function()
  {
    return this.filters;
  }

  this.init = function(cell, buttons, filters, specials, customs)
  {
    this.cell = cell;
    this.buttons = buttons || [];
    this.filters = filters || [];
    this.specials = specials || [];
    this.customs = customs || [];
    this.width = 0;
    this.top = 0;
    this.left = 0;
    this.is_dirty = true;
    this.initBase();
  }

}

/**
  * @constructor
  * @extends ToolbarBase
  */

var Toolbar = function(cell, buttons, filters, specials, customs)
{
  this.init(cell, buttons, filters, specials, customs);
}

/**
  * @constructor
  * @extends ToolbarBase
  */

var TopToolbar = function(cell, buttons, filters, specials, customs)
{
  this.type = 'top-toolbar';
  this.getTopPosition = function()
  {
    return this.cell.top;
  };
  this.init(cell, buttons, filters, specials, customs);
}

/**
  * @constructor
  * @extends ToolbarBase
  */

var WindowToolbar = function(cell, buttons, filters, specials, customs)
{
  this.type = 'window-toolbar';
  this.parent_container_id = cell.id;
  this.init(cell, buttons, filters, specials, customs);

  // window toolbar is positioned static, no need to update style.
  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    // set css properties

    if(!this.default_height)
    {
      this.setCSSProperties()
    }

    dim = this.cell.width - this.horizontal_border_padding;
    if( dim != this.width)
    {
      this.is_dirty = true;
      this.width = dim;
    }

    dim = ( this.__is_visible  && (
            this.buttons.length
            || this.switches && this.switches.length
            || this.filters.length
            || this.specials.length
            || this.customs.length ) ) ? this.default_height : 0;

    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
    }
    this.update(force_redraw)
  }
  // window toolbar is positioned static, no need to update style.
  this.update_style = function(style)
  {
    if (this.height && style.display != "block")
      style.display = "block";
    if (!this.height && style.display != "none")
      style.display = "none";
  }

  this.getCssText = function()
  {
    return '';
  }
}

ToolbarBase.prototype = UIBase;
Toolbar.prototype = new ToolbarBase();
TopToolbar.prototype = new ToolbarBase();
TopUIBase.apply(TopToolbar.prototype);
TopToolbar.prototype.constructor = TopToolbar;
WindowToolbar.prototype = new ToolbarBase();


/**
 * @constructor
 */
var ToolbarSeparator = function()
{
  this.type = "toolbar-separator";

  this.get_template = function()
  {
    return window.templates[this.type]();
  };
};

window.templates || (window.templates = {});
window.templates["toolbar-separator"] = function()
{
  return ["toolbar-separator"];
};

