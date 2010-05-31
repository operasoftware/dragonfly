window.cls = window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.ReplView = function(id, name, container_class, html, default_handler) {
  new cls.ReplService();
  this._resolver = new PropertyFinder();
  this._service = window.services['ecmascript-debugger'];

  this.createView = function(container)
  {
      container.innerHTML = "<div>Hello world</div>";
  };

  this.init(id, name, container_class, html, default_handler);

};
cls.ReplView.prototype = ViewBase;
