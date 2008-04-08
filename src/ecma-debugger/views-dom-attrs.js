(function()
{

  var View = function(id, name, container_class)
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
        data = node_dom_attrs.getData(selectedNode.rt_id, selectedNode.obj_id, arguments);
        if(data)
        {
          filter = node_dom_attrs.getDataFilter();
          container.innerHTML = 
            "<examine-objects rt-id='" + selectedNode.rt_id + "' data-id='node_dom_attrs' class='padding'>" +
                node_dom_attrs.prettyPrint(data, filter) + 
            "</examine-objects>";
        }
    
      }
      
    }


    

    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('dom_attrs', 'DOMa attrs', 'scroll dom-attrs');
  
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
      "hide-null-values": "hide empty string and null values"
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
  )

  // button handlers


  // filter handlers

  
})();