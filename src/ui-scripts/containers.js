﻿/**
  * @constructor
  * @extends UIBase
  */

var ContainerBase = function()
{
  this.type = 'container';
  this.height = 0;
  this.width = 0;
  this.border_left = 1;
  this.border_right = 1;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;
  this.view_id = '';

  this.setDimensions = function(force_redraw, is_resize)
  {
    var dim = '', i = 0;

    if(!this.default_height)
    {
      this.setCSSProperties();
    }

    var toolbar_height =  this.cell.toolbar.height ? this.cell.toolbar.offsetHeight : 0;
    var searchbar_height =  this.cell.searchbar ? this.cell.searchbar.offsetHeight : 0;

    dim = this.cell.top + toolbar_height + searchbar_height + this.cell.tab.offsetHeight;
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

    dim = this.cell.height - toolbar_height - searchbar_height - this.cell.tab.offsetHeight - this.vertical_border_padding;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
    }

    this.update(force_redraw);
    if(views[this.view_id] && (!force_redraw || is_resize))
    {
      views[this.view_id].onresize(document.getElementById(this.type + '-to-' + this.cell.id));
    }

  }

  this.setup = function(view_id)
  {
    var view = views[this.view_id = view_id];
    var container = document.getElementById(this.type + "-to-" + this.cell.id) || this.update();
    if( view )
    {
      var names = ["handler", "edit-handler", "data-tooltip", "data-menu"];
      var values = [view.default_handler, view.edit_handler, view.default_tooltip, view_id];
      names.forEach(function(name, index)
      {
        if (values[index])
          container.setAttribute(name, values[index]);
        else
          container.removeAttribute(name);
      });
      container.className = view.container_class || "";
      container.innerHTML = "";
      if (!view.has_container_id(container.id))
        view.addContainerId(container.id);
      view.update();
    }
  };

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();
  }

}

/**
  * @constructor
  * @extends ContainerBase
  */

var Container = function(cell)
{
  this.init(cell);
}

ContainerBase.prototype = UIBase;
Container.prototype = new ContainerBase();

