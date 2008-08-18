

var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */
cls.FrameInspectionView = function(id, name, container_class)
{

  var self = this;

  var __ref_data = 'frame_inspection';

  this.createView = function(container)
  {
    var 
    selectedObject = window[__ref_data].getSelectedObject(),
    data = null,
    filter = null;
    
    if( selectedObject )
    {
      data = window[__ref_data].getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
      if(data)
      {
        delete container.__call_count;
        // TODO when is it the global scope?
        filter = window[__ref_data].getDataFilter();
        container.innerHTML = 
          "<examine-objects rt-id='" + selectedObject.rt_id + "' " + 
                "data-id=" + __ref_data + " " +
                "obj-id='" + selectedObject.obj_id + "' >" +
              "<start-search-scope></start-search-scope>" +
              window[__ref_data].prettyPrint(data, -1, filter, frame_inspection.filter_type) + 
              "<end-search-scope></end-search-scope>" +
          "</examine-objects>";
        messages.post
        ( 
          'list-search-context', 
          {
            'data_id': __ref_data, 
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
  }

  this.clearView = function()
  {
    // TODO
  }

  this.init(id, name, container_class);

  var onActiveInspectionType = function(msg)
  {
    __ref_data = msg.inspection_type == 'frame' ? 'frame_inspection' : 'object_inspection';
  }

  messages.addListener('active-inspection-type', onActiveInspectionType);

  /*
  this.showGlobalScopeUpdateLink = function()
  {
    var containers = this.getAllContainers(), c = null , i = 0;
    var lis = null, li = null , k = 0;
    for( ; c = containers[i]; i++)
    {
     c.innerHTML = 
      "<div class='padding'><p handler='update-global-scope'>show global scope</p></div>";
    }
  }
  */

}

cls.FrameInspectionView.prototype = ViewBase;
new cls.FrameInspectionView('frame_inspection', ui_strings.M_VIEW_LABEL_FRAME_INSPECTION, 'scroll');



new Settings
(
  // id
  'frame_inspection', 
  // key-value map
  {
    'automatic-update-global-scope': false,
    'hide-default-properties-in-global-scope': true
  }, 
  // key-label map
  {
    'automatic-update-global-scope': ui_strings.S_SWITCH_UPDATE_GLOBAL_SCOPE,
    'hide-default-properties-in-global-scope': ui_strings.S_BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE
  },
  // settings map
  {
    checkboxes:
    [
      'hide-default-properties-in-global-scope'
    ]
  }
);

new ToolbarConfig
(
  'frame_inspection',
  null,
  [
    {
      handler: 'frame_inspection-text-search',
      title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
      label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
    }
  ]
)

new Switches
(
  'frame_inspection',
  [
    "hide-default-properties-in-global-scope"
  ]
);

(function()
{
  var listTextSearch = new ListTextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'frame_inspection' )
    {
      listTextSearch.setContainer(msg.container);
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'frame_inspection' )
    {
      listTextSearch.cleanup();
    }
  }

  var onListSearchContext = function(msg)
  {
    if( msg.data_id == 'frame_inspection' )
    {
      listTextSearch.onNewContext(msg);
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  messages.addListener('list-search-context', onListSearchContext);
  

  eventHandlers.input['frame_inspection-text-search'] = function(event, target)
  {
    listTextSearch.setInput(target);
    listTextSearch.searchDelayed(target.value);
  }
  
  eventHandlers.keyup['frame_inspection-text-search'] = function(event, target)
  {
    listTextSearch.handleKey(event, target);
  }

})()