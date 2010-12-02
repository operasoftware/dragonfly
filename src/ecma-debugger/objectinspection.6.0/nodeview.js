window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends InspectionBaseView
  */

cls.EcmascriptDebugger["6.0"].DOMAttrsView = function(id, name, container_class)
{
  this._data = null;

  this._on_element_selected = function(msg)
  {
    this._data = msg.rt_id &&  msg.obj_id && 
                 new cls.InspectableJSObject(msg.rt_id, msg.obj_id) || null;
    this.update();
  };

  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
  window.messages.addListener('setting-changed', this._on_setting_change.bind(this));
  this.init(id, name, container_class);

}

cls.EcmascriptDebugger["6.0"].DOMAttrsView.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'dom_attrs',
    null,
    [
      {
        handler: 'dom-attrs-text-search',
        shortcuts: 'dom-attrs-text-search',
        title: 'text search'
      }
    ]
  )

  new Switches
  (
    'dom_attrs',
    [
      'inspection.show-prototypes',
      'inspection.show-non-enumerables',
      'inspection.show-default-nulls-and-empty-strings',
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

  ActionBroker.get_instance().get_global_handler().
  register_shortcut_listener('dom-attrs-text-search', 
                             cls.Helpers.shortcut_search_cb.bind(text_search));
  
};
