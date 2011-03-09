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

  const JS_SOURCE_ID = 'js_source';

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  /* action handler interface */

  ActionHandlerInterface.apply(this);

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

  this._handlers['toggle-breakpoint'] = function(event, target)
  {
    var bp_id = parseInt(event.target.get_attr('parent-node-chain', 
                                               'data-breakpoint-id'));
    var bp = this._bps.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      this._toggle_bp(bp, event.target.checked);
    }
  }.bind(this);

  this._handlers['show-breakpoint-in-script-source'] = function(event, target)
  {
    var bp_id = parseInt(event.target.get_attr('parent-node-chain', 
                                               'data-breakpoint-id'));
    var bp = this._bps.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      var js_source_view = window.views[JS_SOURCE_ID];
      if (!js_source_view.isvisible())
      {
        this._ui.show_view(JS_SOURCE_ID);
      }
      js_source_view.show_and_flash_line(bp.script_id, bp.line_nr);
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var bp_id = parseInt(event.target.get_attr('parent-node-chain', 
                                               'data-breakpoint-id'));
    var bp = this._bps.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      this._delete_bp(bp);
    }
  }.bind(this);

  this._handlers['disable-all'] = function(event, target)
  {
    this._bps.get_breakpoints().forEach(function(bp)
    {
      if (bp.is_enabled)
      {
        this._toggle_bp(bp, false);
      }
    }, this);
  }.bind(this);

  this._handlers['delete-all'] = function(event, target)
  {
    this._bps.get_breakpoints().slice().forEach(this._delete_bp, this);
  }.bind(this);

  this._handlers['add-or-edit-condition'] = function(event, target)
  {
    var bp_ele = event.target.has_attr('parent-node-chain', 'data-breakpoint-id');
    this.mode = MODE_EDIT;
    var ele = bp_ele.getElementsByClassName('condition')[0] ||
              bp_ele.render(this._tmpls.breakpoint_condition());
    this._editor.edit(event, ele.firstElementChild);
  }.bind(this);

  this._handlers['submit'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.submit();
      this.mode = MODE_DEFAULT;
      return false;
    }
  }.bind(this);

  this._handlers['cancel'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.cancel();
      this.mode = MODE_DEFAULT;
      return false;
    }
  }.bind(this);

  this._toggle_bp = function(bp, is_checked)
  {
    if (bp.script_id)
    {
      if (is_checked)
      {
        bp.is_enabled = true;
        this._bps.add_breakpoint(bp.script_id, bp.line_nr, bp.id);
      }
      else
      {
        bp.is_enabled = false;
        this._bps.remove_breakpoint(bp.script_id, bp.line_nr);
      }
    }
    else if(bp.event_type)
    {
      bp.is_enabled = is_checked;
      this._ev_bps.handle_breakpoint_with_name(bp.event_type, is_checked);
    }
  };

  this._delete_bp = function(bp)
  {
    this._bps.delete_breakpoint(bp.id);
    if (bp.is_enabled)
    {
      this._toggle_bp(bp, false);
    }
  };

  /* rightclick menu */

  this._menu_common_items =
  [
    {
      label: "Delete",
      handler: this._handlers['delete'],
    },
    {separator: true},
    {
      label: "Disable all",
      handler: this._handlers['disable-all'],
    },
    {
      label: "Delete all",
      handler: this._handlers['delete-all'],
    }
  ];

  this._menu_add_condition =
  [
    {
      label: ui_strings.M_CONTEXTMENU_ADD_CONDITION,
      handler: this._handlers['add-or-edit-condition'],
    },
  ]
  .concat(this._menu_common_items);

  this._menu_edit_condition =
  [
    {
      label: ui_strings.M_CONTEXTMENU_EDIT_CONDITION,
      handler: this._handlers['add-or-edit-condition'],
    },
  ]
  .concat(this._menu_common_items);


  this._menu =
  [
    {
      callback: function(event, target)
      {
        var bp_ele = event.target.has_attr('parent-node-chain', 
                                           'data-breakpoint-id');
        return (
        bp_ele && bp_ele.getElementsByClassName('condition')[0] ?
        this._menu_edit_condition :
        this._menu_add_condition);
      }.bind(this)
    }
  ];

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class, null, null, 'breakpoints-edit');
    this._editor = new window.cls.ConditionEditor(this);
    this._bps = cls.Breakpoints.get_instance();
    this._ev_bps = cls.EventBreakpoints.get_instance();
    this._tmpls = window.templates;
    var ev_hs = window.eventHandlers;
    ev_hs.change['toggle-breakpoint'] = this._handlers['toggle-breakpoint'];
    ev_hs.click['show-breakpoint-in-script-source'] = this._handlers['show-breakpoint-in-script-source'];
    ev_hs.click['disable-all-breakpoints'] =  this._handlers['disable-all'];
    ev_hs.click['delete-all-breakpoints'] =  this._handlers['delete-all'];
    ev_hs.dblclick['edit-condition'] =  this._handlers['add-or-edit-condition'];
    ActionBroker.get_instance().register_handler(this);
    ContextMenu.get_instance().register("breakpoints", this._menu);
    window.messages.addListener('breakpoint-updated', function(){this.update()}.bind(this));
  };

  /* implementation */

  this.createView = function(container)
  {
    var bps = this._bps.get_breakpoints();
    if (bps.length)
    {
      container.clearAndRender(bps.map(this._tmpls.breakpoint, this._tmpls));
    }
    else
    {
      container.clearAndRender(this._tmpls.no_breakpoints());
    }
  };

  this.ondestroy = function()
  {

  };

  this.add_condition = function(condition, bp_id)
  {
    this._bps.set_condition(condition, bp_id);
    this.update();
  }

  this._init(id, name, container_class);

};

cls.BreakpointsView.create_ui_widgets = function()
{
  new ToolbarConfig
  (
    'breakpoints',
    [
      {
        handler: 'disable-all-breakpoints',
        title: "Disable all breakpoints",
      }, 
      {
        handler: 'delete-all-breakpoints',
        title: "Delete all breakpoints",
      },
    ]
  );
}
