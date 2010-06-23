window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends InspectionBaseData
  */

cls.EcmascriptDebugger["6.0"].ObjectInspectionData = function(id, views)
{
  const KEY = 0, VALUE = 1;

  this._is_active_inspection = false;
  this.filter_type = KEY;

  this._on_object_selected = function(msg)
  { 
    this.setObject(msg.rt_id, msg.obj_id);
    if (this._is_active_inspection)
    {
      this._update_views();
    }
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

  this._init(id, views);
  window.messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
  window.messages.addListener('object-selected', this._on_object_selected.bind(this));
  window.messages.addListener('runtime-destroyed', this._on_runtime_destroyed.bind(this));
  
}



