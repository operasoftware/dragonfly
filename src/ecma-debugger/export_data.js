var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  */

cls.ExportData = function ()
{
  this.data = '';
};



/**
  * @constructor 
  * @extends ViewBase
  */
cls.ExportDataView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.hidden_in_settings = true;
  this.requires_view = "export_new";
  this.createView = function(container)
  {
    container.innerHTML = "<div class='padding'><pre>" + export_data.data + "</pre></div>";
  }
  this.init(id, name, container_class);
}

cls.ExportDataView.prototype = ViewBase;



