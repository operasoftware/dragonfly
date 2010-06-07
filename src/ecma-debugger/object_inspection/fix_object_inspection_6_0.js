window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends InspectionBaseData
  */

cls.EcmascriptDebugger["6.0"].FixObjectInspectionData = function(rt_id, obj_id, identifier, _class)
{
  this._init();
  this.setObject(rt_id, obj_id, null, identifier, _class)
}