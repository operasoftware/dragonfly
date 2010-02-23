var cls = window.cls || ( window.cls = {} );


cls.CookiesView = function(id, name, container_class, html, default_handler)
{
  this.createView = function(container)
  {
    container.innerHTML = "test";
  }

  this.init(id, name, container_class);

};

cls.CookiesView.prototype = ViewBase;
