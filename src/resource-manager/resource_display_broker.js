window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
  {
    return cls.ResourceDisplayBroker.instance;
  }
  cls.ResourceDisplayBroker.instance = this;


  this._view = null;
  this._check = function()
  {
    this._view = window.views.resource_detail_view;
  }

  this.show_resource_for_id = function(id, line)
  {
    var data = {};
    var view = window.views.resource_detail_view; //resource_all;
    if (window.services["resource-manager"] && view)
    {
      if (line)
      {
        var data = {"lines":[line]};
      }
      view.show_resource_for_id(id, data);
    }
  }

  this.show_resource_for_url = function(url, line)
  {
    var data = {};
    var view = window.views.resource_detail_view; //resource_all;
    if (window.services["resource-manager"] && view)
    {
      if (line)
      {
        var data = {"lines":[line]};
      }
      new cls.OpenSingleResource(view, cls.ResourceManagerService.instance, url, data);
    }
    else
    {
      window.open(url);
    }
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
