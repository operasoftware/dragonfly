window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
  {
    return cls.ResourceDisplayBroker.instance;
  }
  cls.ResourceDisplayBroker.instance = this;


  this._show_resource = function(resource, line)
  {
    var data = {};
    var manager = window.services["resource-manager"];
    var view = window.views.resource_detail_view;
    if (manager && view)
    {
      if (line)
        data.lines=[line];

      view.show_resource(resource, data);

      return true;
    }
    return false;
  }

  this.show_resource_for_id = function(id, line)
  {
    this._show_resource(id, line);
  }

  this.show_resource_for_url = function(url, line)
  {
    if (!this._show_resource(url, line))
      window.open(url);
  }

  /**
   * convenience method that looks for a data-resource-id or
   * data-resource-url attribute on an element and calls the
   * appropriate method
   */
  this.show_resource_for_ele = function(ele)
  {
    var id = Number( ele.getAttribute("data-resource-id") );
    var url = ele.getAttribute("data-resource-url");
    var line = ele.getAttribute('data-resource-line-number');
    var rt_id;

    if (id)
      this.show_resource_for_id(id, line);
    else if (url)
    {
      //  resolve the URL based on that of the runtime if we only have a relative path
      if (url[0].indexOf('://') == -1)
      {
        rt_id = ele.get_attr('parent-node-chain', 'rt-id');
        if(rt_id)
          url = window.helpers.resolveURLS(runtimes.getURI(rt_id), url);
      }
      this.show_resource_for_url(url, line);
    }
  }

}

cls.ResourceDisplayBroker.get_instance = function()
{
  return this.instance || new cls.ResourceDisplayBroker();
}
