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

  this._on_object_selected = function(msg)
  { 
    this._data = new cls.InspectableJSObject(msg.rt_id, msg.obj_id);
    if (this._last_selected == "object")
    {
      this.update();
    }
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
          [frame.argument_id, 0, 'object', ,'']
        ],
        [
          'this',
          'object',
          ,
          [frame.this_id == '0' ? frame.rt_id : frame.this_id, 0, 'object', , '']
        ]
      ] || null;
      this._data = new cls.InspectableJSObject(frame.rt_id, frame.scope_id, null, null, virtual_properties);
    }
    else if(this._data)
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
  }

  this._on_active_inspection_type = function(msg)
  {
    this._last_selected = msg.inspection_type;
  }

  window.messages.addListener('object-selected', this._on_object_selected.bind(this));
  window.messages.addListener('frame-selected', this._on_frame_selected.bind(this));
  window.messages.addListener('runtime-destroyed', this._on_runtime_destroyed.bind(this));
  window.messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
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
              // TODO create ui string
              ui_strings.S_LABEL_COLLAPSED_INSPECTED_PROTOTYPES,
              ['input',
                'type', 'text',
                'handler', 'update-collapsed-prototypes',
                'class', 'collapsed-prototypes',
                'value', setting.get('collapsed-prototypes').join(', ')
              ],
            ],
            ['span', '  '],
            ['input',
              'type', 'button',
              'value', ui_strings.S_BUTTON_TEXT_APPLY,
              'handler', 'apply-collapsed-prototypes'
            ],
            ['input',
              'type', 'button',
              'value', 'Set default value.',
              'handler', 'default-collapsed-prototypes'
            ],
            'class', ' '
          ]
        ];
      }
    }
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
      alert("Not a valid input.")
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
        title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
      }
    ]
  );

  new Switches
  (
    'inspection',
    [
      'show-prototypes', 
      'show-non-enumerables',
      'show-default-nulls-and-empty-strings',
    ]
  );

  var text_search = new TextSearch();

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

  eventHandlers.keypress['inspection-text-search'] = function(event, target)
  {
    if (event.keyCode == 13)
    {
      text_search.highlight();
    }
  };
};

