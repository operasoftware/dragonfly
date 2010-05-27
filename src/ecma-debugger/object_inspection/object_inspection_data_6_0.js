window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends InspectionBaseData
  */

cls.EcmascriptDebugger["6.0"].Object_inspection_data = function(id)
{
  const KEY = 0, VALUE = 1;

  // should be general inspection
  this._views = ['inspection'];
  this._is_active_inspection = false;
  this.filter_type = KEY;
  this.id = id;

  this.getSelectedObject = function()
  {
    return this._obj_id && {rt_id: this._rt_id, obj_id: this._obj_id} || null;
  }

  this._on_object_selected = function(msg)
  { 
    this.setObject(msg.rt_id, msg.obj_id);
    if (this._is_active_inspection)
      for (var view_id = '', i = 0; view_id = this._views[i] ; i++)
        window.views[view_id].update();
  }

  this._on_active_inspection_type = function(msg)
  {
    this._is_active_inspection = msg.inspection_type == 'object';
  }

  this._on_runtime_destroyed = function(msg)
  {
    if (this._rt_id == msg.id )
    {
      this.clearData();
      window.views.inspection.clearAllContainers();
    }
  }

  messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
  messages.addListener('object-selected', this._on_object_selected.bind(this));
  messages.addListener('runtime-destroyed', this._on_runtime_destroyed.bind(this));
  
}



