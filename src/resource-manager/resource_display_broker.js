window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
  {
    return cls.ResourceDisplayBroker.instance;
  }
  cls.ResourceDisplayBroker.instance = this;

  this.show_resource_for_id = function(id, line)
  {
      if (line)
      {
        var data = {"lines":[line]}
      }
    if (window.services["resource-manager"] && window.views.resource_all)
    {
      var view = window.views.resource_all;
      view.show_resource_for_id(id, data);
    }
  }

  this.show_resource_for_url = function(url, line)
  {

    if (window.services["resource-manager"] && window.views.resource_all)
    {
      if (line)
      {
        var data = {"lines":[line]};
      }
      else
      {
        var data = {};
      }
      new cls.OpenSingleResource(window.views.resource_all, url, data);
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
