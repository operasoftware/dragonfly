(function()
{
  View = function(id, name, container_class)
  {

    var self = this;

    this.createView = function(container)
    {
      var 
      selectedObject = frame_inspection.getSelectedObject(),
      data = null,
      filter = null;
      
      if( selectedObject )
      {
        data = frame_inspection.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
        if(data)
        {
          delete container.__call_count;
          // TODO when is it the global scope?
          filter = frame_inspection.getDataFilter();
          container.innerHTML = 
            "<examine-objects rt-id='" + selectedObject.rt_id + "' " + 
                  "data-id='frame_inspection' " +
                  "obj-id='" + selectedObject.obj_id + "' >" +
                "<start-search-scope></start-search-scope>" +
                frame_inspection.prettyPrint(data, -1, filter, frame_inspection.filter_type) + 
                "<end-search-scope></end-search-scope>" +
            "</examine-objects>";
          messages.post
          ( 
            'list-search-context', 
            {
              'data_id': 'frame_inspection', 
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

  View.prototype = ViewBase;
  new View('frame_inspection', 'Frame Inspection', 'scroll');

  

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
      'automatic-update-global-scope': ' update global scope automatically',
      'hide-default-properties-in-global-scope': 'Hide default properties in global scope'
    },
    // settings map
    {
      checkboxes:
      [
        'automatic-update-global-scope'
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
        title: 'text search'
      }
    ]
  )

  new Switches
  (
    'frame_inspection',
    [
      "hide-default-properties-in-global-scope"
    ]
  )

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