window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.EcmascriptDebugger["6.0"].InspectionBaseView = function()
{

  this.createView = function(container)
  {
    var 
    data_model = window.inspections[this._cur_data],
    object = data_model.get_object(),
    path = null,
    cb = null;

    container.innerHTML = "";
    if (object)
    {
      path = [object.obj_id];
      cb = this._create_view.bind(this, container, data_model, path);
      data_model.inspect(cb, path);
    };
    
  };

  this._create_view = function(container, data_model, path)
  {
    container.render(window.templates.inspected_js_object(data_model, false, path));
  };

}

cls.EcmascriptDebugger["6.0"].DOMAttrsView = function(id, name, container_class)
{

  this._cur_data = 'node_dom_attrs'; // or object_inspection_data
  this.init(id, name, container_class);
}

cls.EcmascriptDebugger["6.0"].DOMAttrsView.create_ui_widgets = function()
{

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
  
};
