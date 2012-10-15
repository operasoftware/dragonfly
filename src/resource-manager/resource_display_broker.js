"use strict";

window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
    return cls.ResourceDisplayBroker.instance;

  cls.ResourceDisplayBroker.instance = this;

  this._show_resource = function(id_or_url, line)
  {
    var data = {};
    var manager = window.services["resource-manager"];
    var view = window.views.resource_detail_view;
    if (manager && view)
    {
      if (line)
        data.lines = [line];

      view.show_resource(id_or_url, data);

      return true;
    }
    return false;
  };

  /**
   * convenience method that looks for a data-resource-id or
   * data-resource-url attribute on an element to show the
   * corresponding resource and fallback to a popup
   */
  this.show_resource_for_ele = function(ele)
  {
    var id = Number(ele.getAttribute("data-resource-id"));
    var url = ele.getAttribute("data-resource-url");
    var line = ele.getAttribute("data-resource-line-number");
    var id_or_url = id;
    var rt_id;

    if (url)
    {
      // resolve the URL based on that of the runtime if we only have a relative path
      if (url.indexOf("://") == -1)
      {
        rt_id = ele.get_attr("parent-node-chain", "rt-id");
        if (rt_id)
          url = window.helpers.resolveURLS(runtimes.getURI(rt_id), url);
      }
    }

    if (!this._show_resource(id_or_url, line) && url)
      window.open(url);
  };

};

cls.ResourceDisplayBroker.get_instance = function()
{
  return this.instance || new cls.ResourceDisplayBroker();
};
