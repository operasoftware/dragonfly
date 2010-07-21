/**
  * @constructor
  * @extends ViewBase
  * @see DOM_markup_style this class can be dynamically exchanged with DOM_markup_style
  */

var DOM_tree_style = function(id, name, container_class)
{
  var self = this;

  const
  ID = 0,
  TYPE = 1,
  NAME = 2,
  DEPTH = 3,
  NAMESPACE = 4,
  VALUE = 4,
  ATTRS = 5,
  ATTR_PREFIX = 0,
  ATTR_KEY = 1,
  ATTR_VALUE = 2,
  CHILDREN_LENGTH = 6,
  PUBLIC_ID = 4,
  SYSTEM_ID = 5;








/*
  this.createView = function(container)
  {
    if (this._create_view_no_data_timeout)
    {
      clearTimeout(this._create_view_no_data_timeout);
      this._create_view_no_data_timeout = 0;
    }

    if (!container.hasClass('tree-style'))
    {
      container.addClass('tree-style');
    }

    if (!data.length)
    {
      this._create_view_no_data_timeout = setTimeout(this._create_view_no_data, 100, container);
    }
    else
    {
      scrollTop = container.scrollTop;
      container.innerHTML = tree;
      container_scroll_width = container.scrollWidth;
      container_first_child = container.firstChild;
      if (!this.scrollTargetIntoView())
      {
        container.scrollTop = scrollTop;
      }
      topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()));
    }
  };
  */
}

