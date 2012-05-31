window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
  {
    return cls.ResourceDisplayBroker.instance;
  }
  cls.ResourceDisplayBroker.instance = this;


  this._check = function(line)
  {
    var data = {};
    var manager = window.services["resource-manager"];
    var view = window.views.resource_detail_view;
    if (line){ data.lines=[line]; }
    if (manager && view){ return {view:view,data:data}; }
    return null;
  }

  this.show_resource_for_id = function(id, line)
  {
    var foo = this._check(line);
    if (foo){ foo.view.show_resource_for_id(id, foo.data); }
/*
    var data = this._get_data(line);
    var view = window.views.resource_detail_view; //resource_all;
    if (window.services["resource-manager"] && view)
    {
      view.show_resource_for_id(id, data);
    }
*/
  }

  this.show_resource_for_url = function(url, line)
  {
    var foo = this._check(line);
    if (foo)
    {
      new cls.OpenSingleResource(foo.view, cls.ResourceManagerService.instance, url, foo.data);
    }
    else
    {
      window.open(url);
    }
/*
    var data = this._get_data(line);
    var view = window.views.resource_detail_view; //resource_all;
    if (window.services["resource-manager"] && view)
    {
      new cls.OpenSingleResource(view, cls.ResourceManagerService.instance, url, data);
    }
    else
    {
      window.open(url);
    }
*/
  }

  /**
   * convenience method that looks for a data-resource-id or
   * data-resource-url attribute on an element and calls the
   * appropriate method
   */
  this.show_resource_for_ele = function(ele)
  {
    var rid, url;
    var line = ele.getAttribute('data-resource-line-number');
    if (rid = ele.getAttribute("data-resource-id")) { this.show_resource_for_id(rid, line) }
    else if (url = ele.getAttribute("data-resource-url")) { this.show_resource_for_url(url, line) }
  }

}

cls.ResourceDisplayBroker.get_instance = function()
{
  return this.instance || new cls.ResourceDisplayBroker();
}
