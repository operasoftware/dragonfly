var export_data = new function ()
{
  this.data = '';
};

(function()
{
  

  var View = function(id, name, container_class)
  {
    this.createView = function(container)
    {
      container.innerHTML = "<div class='padding'><pre>" + export_data.data + "</pre></div>";
    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('export_data', 'Export', 'scroll export-data');

})()