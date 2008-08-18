/**
  * @constructor 
  */

var export_data = new function ()
{
  this.data = '';
};


var cls = window.cls || ( window.cls = {} );
/**
  * @constructor 
  * @extends ViewBase
  */
cls.ExportDataView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.hidden_in_settings = true;
  this.createView = function(container)
  {
    container.innerHTML = "<div class='padding'><pre>" + export_data.data + "</pre></div>";
  }
  this.init(id, name, container_class);
}

cls.ExportDataView.prototype = ViewBase;

new cls.ExportDataView('export_data', ui_strings.M_VIEW_LABEL_EXPORT, 'scroll export-data');

