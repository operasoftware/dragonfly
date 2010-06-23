window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends ObjectDataBase
  */

cls.EcmascriptDebugger["6.0"].NodeDOMAttrs = function(id, views)
{

  const KEY = 0, VALUE = 1;

  this.filter_type = VALUE;

  this._on_element_selected = function(msg)
  {
    this.setObject(msg.rt_id, msg.obj_id);
    this._update_views();
  };

  this.getSelectedNode = this.getSelectedObject;
  this._init(id, views);
  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
}

