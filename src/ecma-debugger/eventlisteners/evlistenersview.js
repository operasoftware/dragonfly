window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EventListenersView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var data = this._data.get_data();
    if (data)
    {
      var tmpl = window.templates.main_ev_listener_view(data);
      container.clearAndRender(tmpl);
    }
  };

  this._toggle_event_listeners = function(event, target)
  {
    var rt_id = Number(target.get_ancestor_attr("data-rt-id"));
    var obj_id = Number(target.get_ancestor_attr("data-obj-id"));
    var ev_name = target.get_ancestor_attr("data-ev-type");
    var li_ele = target.get_ancestor("li");
    if (rt_id && obj_id && ev_name && li_ele)
    {
      if (this._data.is_expanded(rt_id, ev_name))
      {
        var ls = li_ele.querySelector(".ev-listener-list");
        if (ls)
          ls.parentNode.removeChild(ls);

        var h3 = li_ele.querySelector("h3");
        if (h3)
          h3.removeClass("unfolded");

        this._data.collapse_listeners(rt_id, ev_name);
      }
      else
      {
        var cb = this._show_ev_listeners.bind(this, li_ele);
        this._data.expand_listeners(rt_id, obj_id, ev_name, cb);
      }
    }
  };

  this._update_ev_listeners = function(event, target)
  {
    var container = target.get_ancestor("container");
    var ev_rt_list = container && container.querySelector(".ev-rt-list");
    if (ev_rt_list)
      ev_rt_list.parentNode.removeChild(ev_rt_list);

    this._data.update();
  };

  this._show_ev_listeners = function(li_ele, ev_name_obj)
  {
    var tmpl = window.templates.ev_all_listeners(ev_name_obj);
    var h3 = li_ele.querySelector("h3");
    if (h3)
      h3.addClass("unfolded");

    var div = li_ele.querySelector(".ev-listener-list");
    if (div)
      div.parentNode.removeChild(div);

    li_ele.render(tmpl);
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._data = new cls.EventListeners(this);
    var evh = window.event_handlers;
    evh.click["toggle-ev-listeners"] = this._toggle_event_listeners.bind(this);
    evh.click["update-ev-listeners"] = this._update_ev_listeners.bind(this);
  };

  this._init(id, name, container_class);
};

cls.EventListenersView.prototype = ViewBase;
