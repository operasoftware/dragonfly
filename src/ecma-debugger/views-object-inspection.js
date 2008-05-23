(function()
{
  View = function(id, name, container_class)
  {

    var self = this;

    this.createView = function(container)
    {
      var 
      selectedObject = object_inspection.getSelectedObject(),
      data = null,
      filter = null;
      
      if( selectedObject )
      {
        data = object_inspection.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
        filter = object_inspection.getDataFilter();
        if(data)
        {
          delete container.__call_count;
          // TODO when is it the global scope?
          container.innerHTML = 
            "<examine-objects rt-id='" + selectedObject.rt_id + "' " + 
                  "data-id='object_inspection' " +
                  "obj-id='" + selectedObject.obj_id + "' >" +
                "<start-search-scope></start-search-scope>" +
                object_inspection.prettyPrint(data, -1, filter, object_inspection.filter_type) + 
                "<end-search-scope></end-search-scope>" +
            "</examine-objects>";
          messages.post
          ( 
            'list-search-context', 
            {
              'data_id': 'object_inspection', 
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



  }

  View.prototype = ViewBase;
  new View('object_inspection', ui_strings.VIEW_LABEL_OBJECT_INSPECTION, 'scroll');

  

  new Settings
  (
    // id
    'object_inspection', 
    // key-value map
    {
      'hide-default-properties-in-global-scope': true
    }, 
    // key-label map
    {
      'hide-default-properties-in-global-scope': ui_strings.BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE
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
    'object_inspection',
    null,
    [
      {
        handler: 'object_inspection-text-search',
        title: ui_strings.INPUT_DEFAULT_TEXT_FILTER,
        label: ui_strings.INPUT_DEFAULT_TEXT_FILTER
      }
    ]
  )

  new Switches
  (
    'object_inspection',
    [
      "hide-default-properties-in-global-scope"
    ]
  )


  var listTextSearch = new ListTextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'object_inspection' )
    {
      listTextSearch.setContainer(msg.container);
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'object_inspection' )
    {
      listTextSearch.cleanup();
    }
  }

  var onListSearchContext = function(msg)
  {
    if( msg.data_id == 'object_inspection' )
    {
      listTextSearch.onNewContext(msg);
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  messages.addListener('list-search-context', onListSearchContext);

  eventHandlers.input['object_inspection-text-search'] = function(event, target)
  {
    listTextSearch.setInput(target);
    listTextSearch.searchDelayed(target.value);
  }
  
  eventHandlers.keyup['object_inspection-text-search'] = function(event, target)
  {
    listTextSearch.handleKey(event, target);
  }

})()