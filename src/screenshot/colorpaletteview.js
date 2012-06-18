window.cls || (window.cls = {});


cls.ColorPaletteView = function(id, name, container_class)
{
  /* interface inherited from ViewBase */


  /* private */

  this._oneditcolor = function(color)
  {
    this._edit_context.ele_color_sample.style.backgroundColor = color.hhex;
    this._edit_context.ele_color_value.nodeValue = color.hhex;
    cls.ColorPalette.get_instance().update_color(this._edit_context.color_id, color.getHex());
  }.bind(this);

  /* action handler interface */

  ActionHandlerInterface.apply(this);

  this._handlers['color-palette-edit-color'] = function(event, target)
  {
    var list_item = event.target.has_attr('parent-node-chain', 'data-color-id');
    if (list_item)
    {
      var color_sample = list_item.firstElementChild;
      this._edit_context =
      {
        color_id: Number(list_item.getAttribute('data-color-id')),
        initial_color: new Color().parseCSSColor(color_sample.style.backgroundColor),
        ele_value: list_item,
        vertical_anchor_selector: ".color-palette-sample",
        horizontal_anchor_selector: "container",
        ele_color_sample: color_sample,
        ele_color_value: color_sample.nextSibling,
        callback: this._oneditcolor,
        edit_class: 'edited-color',
        alpha_disabled: true,
        palette_disabled: true
      };
      window.views['color-selector'].show_color_picker(color_sample, this._edit_context);
    }
  }.bind(this);

  this._handlers['color-palette-add-color'] = function(event, target)
  {
    var color = cls.ColorPalette.get_instance().store_color("FF0000");
    var tmpl = window.templates.color_palette_item(color);
    var item = this._color_palette_list.render(tmpl);
    this._handlers['color-palette-edit-color']({target: item});
  }.bind(this);

  this._handlers['color-palette-delete-color'] = function(event, target)
  {
    var list_item = event.target.has_attr('parent-node-chain', 'data-color-id');
    var color_id = list_item && Number(list_item.getAttribute('data-color-id'));
    if (color_id && cls.ColorPalette.get_instance().delete_color(color_id))
    {
      list_item.parentNode.removeChild(list_item);
    }
  }.bind(this);

  /* rightclick menu */

  this._menu_common_items =
  [
    {
      label: ui_strings.M_CONTEXTMENU_ADD_COLOR,
      handler: this._handlers['color-palette-add-color'],
    },
  ];

  this._menu_editable_items =
  [
    {
      label: ui_strings.M_CONTEXTMENU_EDIT_COLOR,
      handler: this._handlers['color-palette-edit-color'],
    },
    {
      label: ui_strings.M_CONTEXTMENU_DELETE_COLOR,
      handler: this._handlers['color-palette-delete-color'],
    },
  ]
  .concat(ContextMenu.separator)
  .concat(this._menu_common_items);

  this._menu =
  [
    {
      callback: function(event, target)
      {
        return (
        event.target.get_attr('parent-node-chain', 'data-color-id') ?
        this._menu_editable_items :
        this._menu_common_items);
      }.bind(this)
    }
  ];

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger", "exec"];
    this.init(id, name, container_class);
    window.eventHandlers.click['color-palette-add-color'] =
      this._handlers['color-palette-add-color'];
    window.eventHandlers.dblclick['color-palette-edit-color'] =
      this._handlers['color-palette-edit-color'];
    window.eventHandlers.mouseup['color-palette-edit-color'] = function()
    {
      if (window.getSelection())
      {
        window.getSelection().removeAllRanges();
      }
    }
    ContextMenu.get_instance().register("color-palette", this._menu, true);
  }

  /* implementation */

  this.createView = function(container)
  {
    var color_palette = cls.ColorPalette.get_instance().get_color_palette();
    container.clearAndRender(window.templates.color_palette(color_palette));
    this._color_palette_list = container.firstElementChild;
  };

  this.ondestroy = function()
  {
    UIWindowBase.closeWindow('color-selector');
  }

  /* initialisation */

  this._init(id, name, container_class);
};

cls.ColorPaletteView.prototype = ViewBase;
