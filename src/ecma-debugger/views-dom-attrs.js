var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.DOMAttrsView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    var 
    selectedNode = node_dom_attrs.getSelectedNode(),
    data = null
    filter = {};
    
    if( selectedNode )
    {
      delete container.__call_count;
      data = node_dom_attrs.getData(selectedNode.rt_id, selectedNode.obj_id, -1, arguments);
      if(data)
      {
        filter = node_dom_attrs.getDataFilter();
        container.innerHTML = 
          "<examine-objects rt-id='" + selectedNode.rt_id + "' " + 
                "data-id='node_dom_attrs' " +
                "obj-id='" + selectedNode.obj_id + "' >" +
              "<start-search-scope></start-search-scope>" +
              node_dom_attrs.prettyPrint(data, -1, filter, 1) + 
              "<end-search-scope></end-search-scope>" +
          "</examine-objects>";
        messages.post( 'list-search-context', 
          {
            'data_id': 'node_dom_attrs', 
            'rt_id': selectedNode.rt_id,
            'obj_id': selectedNode.obj_id, 
            'depth': '-1'
          });
      }
  
    }
    
  }


  

  this.init(id, name, container_class);
}
cls.DOMAttrsView.prototype = ViewBase;
new cls.DOMAttrsView('dom_attrs', ui_strings.VIEW_LABEL_DOM_ATTR, 'scroll dom-attrs');

new Settings
(
  // id
  'dom_attrs', 
  // key-value map
  {
    "hide-null-values": true
  }, 
  // key-label map
  {
    "hide-null-values": ui_strings.SWITCH_HIDE_EMPTY_STRINGS
  },
  // settings map
  {
    checkboxes:
    [
      "hide-null-values"
    ]
  }
);

new ToolbarConfig
(
  'dom_attrs',
  null,
  [
    {
      handler: 'dom-attrs-text-search',
      title: 'text search'
    }
  ]
)

new Switches
(
  'dom_attrs',
  [
    "hide-null-values"
  ]
);

(function()
{

  var listTextSearch = new ListTextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'dom_attrs' )
    {
      listTextSearch.setContainer(msg.container);
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'dom_attrs' )
    {
      listTextSearch.cleanup();
    }
  }

  var onListSearchContext = function(msg)
  {
    if( msg.data_id == 'node_dom_attrs' )
    {
      listTextSearch.onNewContext(msg);
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  messages.addListener('list-search-context', onListSearchContext);

  eventHandlers.input['dom-attrs-text-search'] = function(event, target)
  {
    listTextSearch.setInput(target);
    listTextSearch.searchDelayed(target.value);
  }
  
  eventHandlers.keyup['dom-attrs-text-search'] = function(event, target)
  {
    listTextSearch.handleKey(event, target)

    
  }
  

  // button handlers


  // filter handlers

  
})();