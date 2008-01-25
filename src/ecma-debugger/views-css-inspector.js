//window.views = window.views || {};

(function()
{


  var View = function(id, name, container_class)
  {
    var self = this;







    this.createView = function(container)
    {
      container.innerHTML ='';
      container.render(['div', ['pre', css_data.getData()], 'class', 'padding']);
    }





    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('css-inspector', 'CSS', 'scroll css-inspector');


})()
