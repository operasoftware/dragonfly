"use strict";

window.cls = window.cls || {};

cls.ResourceDisplayBroker = function()
{
  if (cls.ResourceDisplayBroker.instance)
    return cls.ResourceDisplayBroker.instance;

  cls.ResourceDisplayBroker.instance = this;

  this._show_resource = function(id_or_url, data)
  {
    var manager = window.services["resource-manager"];
    var view = window.views.resource_detail_view;
    if (manager && view)
    {
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
    var runtime = runtimes.getRuntime(ele.get_attr("parent-node-chain", "rt-id"));
    var data = {};

    // get the window_id of the runtime so as to send the correct headers in createRequest
    if (runtime)
      data.window_id = runtime.window_id;

    if (url)
    {
      // resolve the URL based on that of the runtime if we only have a relative path
      if (runtime && !url.contains("://"))
        url = window.helpers.resolveURLS(runtime.uri, url);

      id_or_url = url;
    }

    if (line)
      data.line = Number(line);

    if (!this._show_resource(id_or_url, data) && url)
      window.open(url);
  };

};

cls.ResourceDisplayBroker.get_instance = function()
{
  return this.instance || new cls.ResourceDisplayBroker();
};
