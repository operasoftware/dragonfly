window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EcmascriptDebugger["6.0"].InspectionView = function(id, name, container_class)
{

  this._data = null;

  this._last_selected = "";  //object or frame

  this.clearView = function()
  {
    // TODO
  };

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
    // TODO
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
  messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
  this.init(id, name, container_class);

};

cls.EcmascriptDebugger["6.0"].InspectionView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'inspection',
    // key-value map
    {
      'automatic-update-global-scope': false,
      'hide-default-properties': true
    },
    // key-label map
    {
      'automatic-update-global-scope': ui_strings.S_SWITCH_UPDATE_GLOBAL_SCOPE,
      'hide-default-properties': ui_strings.S_BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE
    },
    // settings map
    {
      checkboxes:
      [
        'hide-default-properties'
      ]
    }
  );

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
      "hide-default-properties"
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

