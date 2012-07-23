window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.WatchesView = function(id, name, container_class)
{
  /* interface */
  /* inherits from ViewBase */
  /* implements action handler interface */

  this.add_watch = function(key, uid){};

  /* constants */

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  /* private */
  /* templates */

  this._tmpl_main = function()
  {
    return (
    [
      ['div'],
      ['div',
        ['span',
          ['span', ui_strings.S_LABEL_ADD_WATCH],
          'handler', 'watches-add',
          'class', 'ui-button',
          'unselectable', 'on',
          'tabindex', '1'
        ],
        'class', 'watches-controls padding'
      ]
    ]);
  };

  this._tmpl_new_prop = function()
  {
    return ['item', ['key', 'class', 'no-expander', 'data-prop-uid', '0']];
  };

  this._check_no_content = function()
  {
    var proto = this._watch_container &&
                this._watch_container.getElementsByClassName('prototype')[0];
    if (proto && !proto.textContent)
    {
      proto.clearAndRender(['div', ui_strings.M_VIEW_LABEL_NO_WATCHES,
                            'class', 'not-content']);
    }
  }

  /* action handler interface */

  ActionHandlerInterface.apply(this);

  this.onclick = function(event)
  {
    if (this._add_watches_button == event.target)
    {
      return false;
    }

    if (this.mode == MODE_EDIT)
    {
      if (this._editor.onclick(event))
      {
        this.mode = MODE_DEFAULT;
        this._add_watches_button.disabled = false;
      }
      return false;
    }
    return true;
  };

  this.blur = function()
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.cancel();
      this.mode = MODE_DEFAULT;
      return false;
    }
  };

  this._handlers['edit'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this.mode = MODE_EDIT;
      this._editor.edit(event, ele);
      this._add_watches_button.disabled = true;
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this._data.remove_property(ele.getAttribute('data-prop-uid'));
    }
    this._check_no_content();
  }.bind(this);

  this._handlers['delete-all'] = function(event, target)
  {
    this._data.remove_all_properties();
    this._check_no_content();
  }.bind(this);

  this._handlers['submit'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.submit();
      this._check_no_content();
      this._add_watches_button.disabled = false;
      this.mode = MODE_DEFAULT;
      return false;
    }
  }.bind(this);

  this._handlers['cancel'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      var ele = this._editor.cancel();
      if (!this._editor.context_enter.value)
      {
        var item = ele.parentNode;
        item.parentNode.removeChild(item);
      }
      this._check_no_content();
      this._add_watches_button.disabled = false;
      this.mode = MODE_DEFAULT;
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
        var no_content = proto.getElementsByClassName('not-content')[0];
        if (no_content)
        {
          proto.removeChild(no_content);
        }
        var key = proto.render(this._tmpl_new_prop()).firstElementChild;
        this.mode = MODE_EDIT;
        this._editor.edit(event, key);
        this._add_watches_button.disabled = true;
      }
    }
  }.bind(this);

  this._onframeselected = function(msg)
  {
    if (msg.frame_index != -1 || this._last_selected_frame_index != -1)
    {
      this._data.update_watches();
    }
    this._last_selected_frame_index = msg.frame_index;
  };

  this._get_editable_item = function(event, target)
  {
    var ele = event.target;
    while (ele && ele.nodeName.toLowerCase() != 'item' &&
          (ele = ele.parentNode) && ele != target);
    ele = ele && ele.getElementsByTagName('key')[0];
    if (ele && ele.hasAttribute('data-prop-uid'))
    {
      return ele;
    }
    return null;
  };

  /* rightclick menu */

  this._menu_common_items =
  [
    {
      label: ui_strings.S_LABEL_ADD_WATCH,
      handler: this._handlers['add']
    }
  ];

  this._menu_editable_items =
  [
    {
      label: ui_strings.S_LABEL_EDIT_WATCH,
      handler: this._handlers['edit']
    },
    {
      label: ui_strings.S_LABEL_DELETE_WATCH,
      handler: this._handlers['delete']
    },
    {
      label: ui_strings.S_LABEL_DELETE_ALL_WATCHES,
      handler: this._handlers['delete-all']
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

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger"];
    this.init(id, name, container_class, null, null, 'watches-edit-prop');
    this._last_selected_frame_index = 0;
    this._watch_container = null;
    this._data = new cls.Watches(this);
    this._editor = new cls.JSPropertyEditor(this);
    eventHandlers.dblclick['watches-edit-prop'] = this._handlers['edit'];
    eventHandlers.click['watches-add'] = this._handlers['add'];
    ActionBroker.get_instance().register_handler(this);
    ContextMenu.get_instance().register("watches", this._menu);
    messages.addListener('frame-selected', this._onframeselected.bind(this));
  };

  /* implementation */

  this.createView = function(container)
  {
    if (!this._watch_container)
    {
      container.clearAndRender(this._tmpl_main());
      this._watch_container = container.firstElementChild;
      this._add_watches_button = container.querySelector('.ui-button');
    }
    var tmpl = window.templates.inspected_js_object(this._data, false, null);
    this._watch_container.clearAndRender(tmpl);
    this._check_no_content();
  };

  this.ondestroy = function()
  {
    this._watch_container = null;
    this._add_watches_button = null;
  };

  this.add_watch = function(key, uid)
  {
    if (key)
    {
      this._data.add_property(key, uid);
    }
    else
    {
      this._data.remove_property(uid);
    }
  };

  this._init(id, name, container_class);

};
