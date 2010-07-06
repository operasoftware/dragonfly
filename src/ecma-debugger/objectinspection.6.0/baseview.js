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
    var data_model = this._data || window.inspections[this._cur_data];
    container.innerHTML = "";
    if (data_model)
      data_model.expand(this._create_view.bind(this, container, data_model));
  };

  this._create_view = function(container, data_model)
  {
    container.render(window.templates.inspected_js_object(data_model, false));
  };

}