var TempBaseView = function()
{
  this._count = 0;
  this._init_super = this.init;
  this._getid = (function()
  {
    var count = 0;
    return function()
    {
      return "temp-view-" + (++count);
    }
  })();
  this.init = function(name, container_class, html, default_handler)
  {
    this._init_super(this._getid(), name, container_class, html, default_handler);
  }
};
var TempView = function(name, container_class, html, default_handler){};
TempBaseView.prototype = ViewBase;
TempView.prototype = new TempBaseView();
