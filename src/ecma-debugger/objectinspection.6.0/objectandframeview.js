window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends InspectionBaseView
  */

cls.EcmascriptDebugger["6.0"].InspectionView = function(id, name, container_class)
{

  this._data = null;

  this._last_selected = "";  //object or frame

  // To keep backward compatibility with old code.
  this.clearView = function(){};


  this._tmpl_no_content = function()
  {
    return (
    [
      'div',
        ui_strings.M_VIEW_LABEL_NO_INSPECTION,
        'class', 'not-content inspection'
    ]);
  };

  this._on_object_selected = function(msg)
  {
    this._data = new cls.InspectableJSObject(msg.rt_id, msg.obj_id);

    if (this._last_selected == "object")
    {
      this.update();
    }
  };

  this._on_trace_frame_selected = function(msg)
  {
    var virtual_properties =
    [
      [
        'arguments',
        'object',
        ,
        [msg.arg_id, 0, 'object', ,'']
      ],
      [
        'this',
        'object',
        ,
        [msg.rt_id == '0' ? msg.rt_id : msg.this_id, 0, 'object', , '']
      ]
    ];

    this._data = new cls.InspectableJSObject(msg.rt_id,
                                             msg.obj_id,
                                             null, null, virtual_properties);
    this.update();
  }

  this._on_frame_selected = function(msg)
  {
    var frame = stop_at.getFrame(msg.frame_index);
    if (frame)
    {
      var virtual_properties =
      frame.argument_id &&
      [
        [
          'arguments',
          'object',
          ,
          frame.argument_value || [frame.argument_id, 0, 'object', ,'']
        ],
        [
          'this',
          'object',
          ,
          frame.this_value || [frame.this_id == '0' ? frame.rt_id : frame.this_id,
                               0, 'object', , '']
        ]
      ] || null;
      this._data = new cls.InspectableJSObject(frame.rt_id,
                                               frame.scope_id,
                                               null,
                                               null,
                                               virtual_properties,
                                               frame.scope_list);
    }
    else if(this._data && this._last_selected == "frame")
    {
      this._data.collapse();
      this._data = null;
    }
    if (this._last_selected == "frame")
    {
      this.update();
    }
  };

  this._on_runtime_destroyed = function(msg)
  {
    if (this._data && this._data._rt_id == msg.id )
    {
      this._data.collapse();
      this._data = null;
      this.clearAllContainers();
    }
  };

  this._on_active_inspection_type = function(msg)
  {
    this._last_selected = msg.inspection_type;
  };

  this._super_init = this.init;

  this.init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger"];
    var msgs = window.messages;
    msgs.addListener('object-selected', this._on_object_selected.bind(this));
    msgs.addListener('frame-selected', this._on_frame_selected.bind(this));
    msgs.addListener('trace-frame-selected', this._on_trace_frame_selected.bind(this));
    msgs.addListener('runtime-destroyed', this._on_runtime_destroyed.bind(this));
    msgs.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
    msgs.addListener('setting-changed', this._on_setting_change.bind(this));
    this.onbeforesearch = function(msg)
    {
      this._onbeforesearch(msg.search_term);
    }.bind(this);
    this._super_init(id, name, container_class);
  };

  this.init(id, name, container_class);

};

// e.g. ['Object', 'Function', 'Array', 'String', 'Number'];
cls.EcmascriptDebugger["6.0"].InspectionView.DEFAULT_COLLAPSED_PROTOS = ['*'];


cls.EcmascriptDebugger["6.0"].InspectionView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'inspection',
    // key-value map
    {
      'show-non-enumerables': true,
      'show-prototypes': true,
      'show-default-nulls-and-empty-strings': true,
      'collapsed-prototypes': this.DEFAULT_COLLAPSED_PROTOS,
    },
    // key-label map
    {
      'show-prototypes': ui_strings.S_SWITCH_SHOW_PROTOTYPES,
      'show-default-nulls-and-empty-strings':
        ui_strings.S_SWITCH_SHOW_FEFAULT_NULLS_AND_EMPTY_STRINGS,
      'show-non-enumerables': ui_strings.S_SWITCH_SHOW_NON_ENUMERABLES
    },
    // settings map
    {
      checkboxes:
      [
        'show-prototypes',
        'show-non-enumerables',
        'show-default-nulls-and-empty-strings',
      ],
      customSettings:
      [
        'collapsed_protos'
      ]
    },
    // template
    {
      collapsed_protos:
      function(setting)
      {
        return [
          ['setting-composite',
            ['label',
              ui_strings.S_LABEL_COLLAPSED_INSPECTED_PROTOTYPES,
              ['input',
                'type', 'text',
                'handler', 'update-collapsed-prototypes',
                'class', 'collapsed-prototypes',
                'value', setting.get('collapsed-prototypes').join(', ')
              ],
            ],
            ['span', '  '],
            ['span',
              ui_strings.S_BUTTON_TEXT_APPLY,
              'handler', 'apply-collapsed-prototypes',
              'class', 'ui-button',
              'tabindex', '1'
            ],
            ['span',
              ui_strings.S_BUTTON_SET_DEFAULT_VALUE,
              'handler', 'default-collapsed-prototypes',
              'class', 'ui-button',
              'tabindex', '1'
            ],
            'class', ' '
          ]
        ];
      }
    },
	"script"
  );

  window.eventHandlers.input['update-collapsed-prototypes'] = function(event, target)
  {
    // target.parentNode.parentNode.getElementsByTagName('input')[1].disabled = false;
  }

  window.eventHandlers.click['apply-collapsed-prototypes'] = function(event, target)
  {
    var protos = target.parentNode.getElementsByTagName('input')[0].value;
    try
    {
      protos = JSON.parse("[\"" + protos.split(',').join("\", \"") + "\"]");
    }
    catch(e)
    {
      alert("Not a valid input.");
      protos = null;
    };
    if(protos)
        window.settings.inspection.set('collapsed-prototypes', protos);
  }

  window.eventHandlers.click['default-collapsed-prototypes'] = function(event, target)
  {
    var defaults = cls.EcmascriptDebugger["6.0"].InspectionView.DEFAULT_COLLAPSED_PROTOS;
    target.parentNode.getElementsByTagName('input')[0].value = defaults.join(', ');
    window.settings.inspection.set('collapsed-prototypes', defaults);
  }

  new ToolbarConfig
  (
    'inspection',
    null,
    [
      {
        handler: 'inspection-text-search',
        shortcuts: 'inspection-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        type: "filter"
      }
    ]
  );

  new Switches
  (
    'inspection',
    [
      'show-non-enumerables',
      'show-default-nulls-and-empty-strings',
    ]
  );

  var text_search = new TextSearch(1);
  text_search.add_listener("onbeforesearch",
                           window.views.inspection.onbeforesearch);

  var onViewCreated = function(msg)
  {
    if (msg.id == 'inspection')
    {
      text_search.setContainer(msg.container);
      text_search.setFormInput(views.inspection.getToolbarControl(msg.container, 'inspection-text-search'));
    }
  };

  var onViewDestroyed = function(msg)
  {
    if (msg.id == 'inspection')
    {
      text_search.cleanup();
    }
  };

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  eventHandlers.input['inspection-text-search'] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.get_instance().get_global_handler().
  register_shortcut_listener('inspection-text-search',
                             cls.Helpers.shortcut_search_cb.bind(text_search));

  var broker = ActionBroker.get_instance();
  var contextmenu = ContextMenu.get_instance();

  contextmenu.register("object-inspection-key", [
    {
      callback: function(event, target)
      {
        // Prevent "Watch <prop>" from showing up in the first level in watches view
        if (target.has_attr("parent-node-chain", "data-menu").parentNode
                  .get_attr("parent-node-chain", "data-menu") == "watches")
        {
          return;
        }

        var ele = target.parentNode;
        var props = [];
        while (ele)
        {
          if (ele.nodeName.toLowerCase() == "item")
            props.unshift(ele.querySelector("key").textContent);
          ele = ele.parentNode;
        }

        // If we're in the scope chain, remove "scope <n>"
        if (target.get_ancestor(".scope-chain"))
          props.shift();

        if (!props.length)
          return;

        var is_number_without_leading_zero = /^0$|^[1-9][0-9]*$/;
        var prop = props.reduce(function(prev, curr) {
          if (JSSyntax.is_valid_identifier(curr))
          {
            curr = "." + curr;
          }
          else
          {
            if (!is_number_without_leading_zero.test(curr))
              curr = '"' + curr + '"';
            curr = "[" + curr + "]";
          }
          return prev + curr;
        });

        return {
          // '$' is special in replace(), this makes sure that e.g. '$$' really stays that way
          label: ui_strings.M_CONTEXTMENU_ADD_WATCH.replace("%s", prop.replace("$", "$$$")),
          handler: function(event, target) {
            window.views.watches.add_watch(prop);
          }
        };
      }
    }
  ]);
};

