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
    data = null,
    use_filter = settings['dom_attrs'].get("hide-null-values");
    
    if( selectedNode )
    {
      delete container.__call_count;
      data = node_dom_attrs.getData(selectedNode.rt_id, selectedNode.obj_id, -1, arguments);
      if(data)
      {
        container.innerHTML = 
          "<examine-objects rt-id='" + selectedNode.rt_id + "' " + 
                "data-id='node_dom_attrs' " +
                "obj-id='" + selectedNode.obj_id + "' class='search-scope-inspection'>" +
              node_dom_attrs.prettyPrint(data, -1, use_filter, 1) + 
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
new cls.DOMAttrsView('dom_attrs', ui_strings.M_VIEW_LABEL_DOM_ATTR, 'scroll dom-attrs');

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
    "hide-null-values": ui_strings.S_SWITCH_HIDE_EMPTY_STRINGS
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

  var text_search = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'dom_attrs' )
    {
      text_search.setContainer(msg.container);
      text_search.setFormInput(views.dom_attrs.getToolbarControl( msg.container, 'dom-attrs-text-search'));
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'dom_attrs' )
    {
      text_search.cleanup();
      topCell.statusbar.updateInfo();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  eventHandlers.input['dom-attrs-text-search'] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  }
  
  eventHandlers.keypress['dom-attrs-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      text_search.highlight();
    }
  }
  
})();
