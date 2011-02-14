window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.BreakpointsView = function(id, name, container_class)
{
  /* interface */
  /* inherits from ViewBase */
  /* implements action handler interface */

  /* action handler interface */

  ActionHandlerInterface.apply(this);
  /*
  this.onclick = function(event)
  {
    if (this.mode == MODE_EDIT)
    {
      if (this._editor.onclick(event))
      {
        this.mode = MODE_DEFAULT;
        return true;
      }
      return false;
    }
    return true;
  };

  this._handlers['edit'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this.mode = MODE_EDIT;
      this._editor.edit(event, ele);
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this._data.remove_property(ele.getAttribute('data-prop-uid'));
    }
  }.bind(this);

  this._handlers['submit'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.submit();
      return false;
    }
  }.bind(this);

  this._handlers['cancel'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.cancel();
      return false;
    }
  }.bind(this);

  this._handlers['add'] = function(event, target)
  {
    if (this._watch_container)
    {
      var proto = this._watch_container.getElementsByClassName('prototype')[0];
      if (proto)
      {
        var key = proto.render(this._tmpl_new_prop()).firstElementChild;
        this.mode = MODE_EDIT;
        this._editor.edit(event, key);
      }
    }
  }.bind(this);
*/


  /* rightclick menu */
/*
  this._menu_common_items =
  [
    {
      label: "Add watch",
      handler: this._handlers['add'],
    }
  ];

  this._menu_editable_items =
  [
    {
      label: "Edit",
      handler: this._handlers['edit'],
    },
    {
      label: "Delete",
      handler: this._handlers['delete'],
    }
  ]
  .concat(ContextMenu.separator)
  .concat(this._menu_common_items);

  this._menu =
  [
    {
      callback: function(event, target)
      {
        return (
        this._get_editable_item(event, target) ?
        this._menu_editable_items :
        this._menu_common_items);
      }.bind(this)
    }
  ];
*/
  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class, null, null, 'breakpoints-edit');

  };

  /* implementation */

  this.createView = function(container)
  {
    container.innerHTML = "hello";
  };

  this.ondestroy = function()
  {

  };


  this._init(id, name, container_class);

};
