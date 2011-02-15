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
      var js_source_view = window.views[JS_SOURCE_ID];
      var is_displayed_script = js_source_view.isvisible() && 
                                js_source_view.getCurrentScriptId() == bp.script_id;
      if (event.target.checked)
      {
        bp.is_enabled = true;
        window.runtimes.setBreakpoint(bp.script_id, bp.line_nr, bp.id);
        if (is_displayed_script)
        {
          js_source_view.addBreakpoint(bp.line_nr);
        }
      }
      else
      {
        bp.is_enabled = false;
        window.runtimes.removeBreakpoint(bp.script_id, bp.line_nr);
        if (is_displayed_script)
        {
          js_source_view.removeBreakpoint(bp.line_nr);
        }
      }
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
      js_source_view.showLine(bp.script_id, bp.line_nr - 10);
    }
  }.bind(this);

  this._handlers['disable'] = function(event, target)
  {

  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {

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


  /* rightclick menu */

  this._menu_common_items =
  [
    {
      label: "Disable",
      handler: this._handlers['disable'],
    },
    {
      label: "Delete",
      handler: this._handlers['delete'],
    }
  ];

  this._menu_add_condition =
  [
    {
      label: "Add condition",
      handler: this._handlers['add-or-edit-condition'],
    },
  ]
  .concat(this._menu_common_items);

  this._menu_edit_condition =
  [
    {
      label: "Edit condition",
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
    this._tmpls = window.templates;

    window.eventHandlers.change['toggle-breakpoint'] = 
      this._handlers['toggle-breakpoint'];
    window.eventHandlers.click['show-breakpoint-in-script-source'] = 
      this._handlers['show-breakpoint-in-script-source'];
    ActionBroker.get_instance().register_handler(this);
    ContextMenu.get_instance().register("breakpoints", this._menu);
    

  };

  /* implementation */

  this.createView = function(container)
  {
    container.clearAndRender(this._bps.get_breakpoints().map(this._tmpls.breakpoint, 
                                                             this._tmpls));
  };

  this.ondestroy = function()
  {

  };

  this.add_condition = function(condition, bp_id)
  {
    this._bps.set_condition(condition, bp_id);
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
        handler: 'remove-all-breakpoints',
        title: "Remove all breakpoints",
      },
    ]
  );
}
