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
    var data_model = this._data || window.inspections && window.inspections[this._cur_data];
    if (data_model)
    {
      this._create_view_bound = this._create_view.bind(this, container, data_model);
      data_model.expand(this._create_view_bound);
    }
    else
    {
      this._create_view_bound = null;
      container.clearAndRender(this._tmpl_no_content());
    }
  };

  this._on_setting_change = function(msg)
  {
    if (msg.id == 'inspection')
      switch (msg.key)
      {
        case 'show-default-nulls-and-empty-strings':
          this.update();
          break;
      }
  };

  this._create_view = function(container, data_model)
  {
    var tmpl = window.templates.inspected_js_object(data_model, false,
                                                    null, this._searchterm);
    container.clearAndRender(tmpl);
  };

  this._onbeforesearch = function(searchterm)
  {
    if (this._create_view_bound && this.isvisible())
    {
      this._searchterm = searchterm;
      this._create_view_bound();
    }
  };

  this._tmpl_no_content = function(){return []};

}

cls.EcmascriptDebugger["6.0"].InspectionBaseView.prototype = ViewBase;
