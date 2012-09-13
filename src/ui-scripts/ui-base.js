﻿/**
  * @constructor
  */

var UIBase = new function()
{
  var self = this;
  var id_count = 1;

  var ids = {};

  var getId = function()
  {
    return 'ui-' + (id_count++).toString();
  }

  this.getUIById = function(id)
  {
    return ids[id];
  }

  /*
  this.getViewWithHandler = function(target)
  {
    var container = null, ui_obj = null;
    while( target
            && !/^(toolbar|container|tabs)$/.test(target.nodeName)
            && ( target = target.parentElement ) );
    if( target )
    {
      if( container = /container/.test(target.id) && target
          || document.getElementById(target.id.replace(/^(toolbar|tabs)/, "container") ) )
      {
        ui_obj = this.getUIById(container.getAttribute('ui-id'));
      }
      return ui_obj && views[ui_obj.view_id] || null;
    }
  }
  */

  this._delete = function(id)
  {
    delete ids[id];
  }


  this.initBase = function()
  {
    ids [ this.id = getId() ] = this;
  }

  this.parent_container_id = '';

  this.update_style = function(style)
  {
    var props = ['left', 'top', 'width', 'height'], prop = '', i = 0;
    for (; prop = props[i]; i++)
    {
      if (this[prop] !== parseInt(style[prop]))
        style[prop] = this[prop] + 'px';
    }
  }

  this.__is_visible = true;

  this.isvisible = function()
  {
    return this.cell && document.getElementById(this.type + '-to-' + this.cell.id) && true || false;
  }

  this.getElement = function()
  {
    return this.cell && document.getElementById(this.type + '-to-' + this.cell.id);
  }

  this.update = function(force_redraw)
  {
    if( force_redraw )
    {
      this.is_dirty = true;
    }
    var id = this.type + '-to-' + this.cell.id
    var ele = document.getElementById(id);
    var attr_key = '';
    if( !ele )
    {
      ele = document.createElement(this.type);
      ele.id = id;
      ele.setAttribute('ui-id', this.id);
      if( this.attributes )
      {
        for( attr_key in  this.attributes )
        {
          ele.setAttribute(attr_key, this.attributes[attr_key]);
        }
      }
      if( this.parent_container_id )
      {
        var parent_container = document.getElementById(this.parent_container_id);
        if(parent_container)
        {
          parent_container.appendChild(ele);
        }
        else
        {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            'missing parent_container in update in UIBase');
        }

      }
      else
      {
        viewport.appendChild(ele);
      }
    }

    if( this.is_dirty )
    {
      this.is_dirty = false;
      this.update_style(ele.style);
      this.update_sub_class();
    }
    return ele;
  }

  this.update_sub_class = function() {};

  this.getPropertiesSum = function(prop_arr)
  {
    var
    prop = '',
    i = 0,
    ret = 0;
    for( ; prop = prop_arr[i]; i++)
    {
      ret += this.style[prop];
    }
    return ret;
  }

  this.horizontal_border_padding_properties =
    ['border-right-width', 'border-left-width', 'padding-right', 'padding-left'];
  this.vertical_border_padding_properties =
    ['border-top-width', 'border-bottom-width', 'padding-top', 'padding-bottom'];

  this.left_border_padding_properties =
    ['border-left-width', 'padding-left'];
  this.top_border_padding_properties =
    ['border-top-width', 'padding-top'];

  this.setCSSProperties = function()
  {
    this.vertical_border_padding = this.getPropertiesSum(this.vertical_border_padding_properties);
    this.horizontal_border_padding = this.getPropertiesSum(this.horizontal_border_padding_properties);
    this.left_border_padding = this.getPropertiesSum(this.left_border_padding_properties);
    this.top_border_padding = this.getPropertiesSum(this.top_border_padding_properties);
    this.default_height = this.height = this.style.height;
    this.offsetHeight = this.height + this.vertical_border_padding;
    this.offsetWidth = this.width + this.horizontal_border_padding;

  }

  this.copyCSS = function(resolve_map)
  {
    var
      item = null,
      declaration = null,
      properties = null,
      property = '',
      source = null,
      target = null,
      i=0,
      j=0,
      container = viewport.appendChild(document.createElement('div'));

    container.style.cssText = 'position:absolute;top:0;left:-1000px;';
    for( ; item = resolve_map[i]; i++)
    {
      container.innerHTML = '';
      source = item.source
             ? container.appendChild(document.createElement(item.source))
             : container.render(item.template);
      if (item.source_attrs)
      {
        for (var key in item.source_attrs)
        {
          source.setAttribute(key, item.source_attrs[key]);
        }
      }
      target = item.target.style = {};
      properties = item.properties;
      if( source && target )
      {
        declaration = getComputedStyle(source, null);
        for( j = 0; property = properties[j]; j++)
        {
          if(property.setProp)
          {
            item.target[property.t_name] = property.setProp(source, declaration);
          }
          else
          {
            target[property.t_name ? property.t_name : property.s_name] =
              parseInt(declaration.getPropertyValue(property.s_name));
          }
        }


      }
    }
    viewport.removeChild(container);
  }

  this.setVisibility = function(visibility)
  {
    this.__is_visible = visibility == "visible";
  }

  this.getFocusCatcher = function()
  {
    if( !document.getElementById(defaults.focus_catcher_id))
    {
      viewport.render
      (
        ['div',
          ['input', 'id', defaults.focus_catcher_id],
          'style', 'position:absolute;left:-300px;top:0;width:100px;'
        ]
      );
    }
    return document.getElementById(defaults.focus_catcher_id)
  }
}

