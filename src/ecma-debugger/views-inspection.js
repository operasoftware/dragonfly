window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EcmascriptDebugger["6.0"].InspectionView =
cls.EcmascriptDebugger["5.0"].InspectionView = function(id, name, container_class)
{
  var self = this;

  var cur_data = 'frame_inspection_data'; // or object_inspection_data

  this.createView = function(container)
  {
    var
    data_model = window[cur_data],
    selectedObject = data_model.getSelectedObject(),
    data = null,
    use_filter = settings['inspection'].get("hide-default-properties");

    if (selectedObject)
    {
      data = data_model.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
      if (data)
      {
        delete container.__call_count;
        container.innerHTML =
          "<examine-objects rt-id='" + selectedObject.rt_id + "' " +
                "data-id=" + cur_data + " " +
                "obj-id='" + selectedObject.obj_id + "' >" +
              "<start-search-scope></start-search-scope>" +
              data_model.prettyPrint(data, -1, use_filter, data_model.filter_type) +
              "<end-search-scope></end-search-scope>" +
          "</examine-objects>";

        messages.post
        (
          'list-search-context',
          {
            'data_id': cur_data,
            'rt_id': selectedObject.rt_id,
            'obj_id': selectedObject.obj_id,
            'depth': '-1'
          }
        );
      }
    }
    else
    {
      container.innerHTML = "";
    }
  };

  this.clearView = function()
  {
    // TODO
  };

  this.init(id, name, container_class);

  var onActiveInspectionType = function(msg)
  {
    cur_data = msg.inspection_type + '_inspection_data';
  }

  messages.addListener('active-inspection-type', onActiveInspectionType);
};

cls.EcmascriptDebugger["5.0"].InspectionView.create_ui_widgets = function()
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

