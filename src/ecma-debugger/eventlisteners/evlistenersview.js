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
        var ls = li_ele.querySelector(".ev-all-listeners");
        if (ls)
          ls.parentNode.removeChild(ls);

        var input = li_ele.querySelector("input");
        if (input)
          input.style.removeProperty("background-position");

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
    // TODO testing
    target.get_ancestor("container").innerHTML = "";
    this._data.update();
  };

  this._show_ev_listeners = function(li_ele, ev_name_obj)
  {
    var tmpl = window.templates.ev_all_listeners(ev_name_obj);
    var input = li_ele.querySelector("input");
    if (input)
      input.style.backgroundPosition = "0px -11px";

    var div = li_ele.querySelector(".ev-all-listeners");
    if (div)
      div.parentNode.removeChild(div);

    li_ele.render(tmpl);
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._data = new cls.EvenetListeners(this);
    var evh = window.event_handlers;
    evh.click["toggle-ev-listeners"] = this._toggle_event_listeners.bind(this);
    evh.click["update-ev-listeners"] = this._update_ev_listeners.bind(this);
  };

  this._init(id, name, container_class);
};
