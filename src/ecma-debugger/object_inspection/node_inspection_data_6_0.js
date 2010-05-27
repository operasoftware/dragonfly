window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends ObjectDataBase
  */

cls.EcmascriptDebugger["6.0"].NodeDOMAttrs = function(id)
{

  const KEY = 0, VALUE = 1;

  this._views = ['dom_attrs'];
  this.filter_type = VALUE;
  this.id = id;

  this.getSelectedNode =
  this.getSelectedObject = function()
  {
    return this._obj_id && {rt_id: this._rt_id, obj_id: this._obj_id} || null;
  };

  this._on_element_selected = function(msg)
  {
    this.setObject(msg.rt_id, msg.obj_id);
    for (var view_id = '', i = 0; view_id = this._views[i] ; i++)
    {
      views[view_id].update();
    }
  };

  messages.addListener('element-selected', this._on_element_selected.bind(this));
}

