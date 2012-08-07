window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EventListenersView = function(id, name, container_class)
{
  var for_each = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  this.createView = function(container)
  {
    this._text_search.setContainer(container);
    var input = this.getToolbarControl(container, cls.EventListenersView.TOKEN_FILTER);
    this._text_search.setFormInput(input);
    this._container = container;
    this._create_view();
  };

  this.ondestroy = function()
  {
    this._text_search.cleanup();
    this._container = null;
  };

  this._create_view = function(search_term)
  {
    if (this._container)
    {
      var data = this._data.get_data();
      if (data)
      {
        var tmpl = window.templates.main_ev_listener_view(data, search_term);
        this._container.clearAndRender(tmpl);
      }
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
        if (event.type != "contextmenu")
        {
          var ls = li_ele.querySelector(".ev-listener-list");
          if (ls)
            ls.parentNode.removeChild(ls);

          var h3 = li_ele.querySelector("h3");
          if (h3)
            h3.removeClass("unfolded");

          this._data.collapse_listeners(rt_id, ev_name);
        }
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

  this._onbeforesearch = function(msg)
  {
    this._create_view(msg.search_term);
  };

  this._oninput = function(event, target)
  {
    this._text_search.searchDelayed(target.value);
  };

  this._onsettingchange = function(msg)
  {
    if (msg.id == "dom" && msg.key == "dom-tree-style")
      this.update();
  };

  this._expand_all_types = function(event, target)
  {
    var list = event.target.get_ancestor(".ev-type-list");
    var types = list && list.querySelectorAll(".ev-type");
    if (types)
      for_each(types, this._toggle_event_listeners.bind(this, event));
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._data = new cls.EventListeners(this);
    var update_ev_listeners = this._update_ev_listeners.bind(this);
    var evh = window.event_handlers;
    evh.click["toggle-ev-listeners"] = this._toggle_event_listeners.bind(this);
    evh.click["update-ev-listeners"] = update_ev_listeners;
    this._text_search = new TextSearch(1);
    this._text_search.set_query_selector(".ev-type");
    this._text_search.add_listener("onbeforesearch", this._onbeforesearch.bind(this));
    evh.input[cls.EventListenersView.TOKEN_FILTER] = this._oninput.bind(this);
    var global_handler = ActionBroker.get_instance().get_global_handler();
    var cb = cls.Helpers.shortcut_search_cb.bind(this._text_search);
    global_handler.register_shortcut_listener(cls.EventListenersView.TOKEN_FILTER, cb);
    var contextmenu =
    [
      {
        label: ui_strings.S_LABEL_STORAGE_UPDATE,
        handler: update_ev_listeners
      },
      {
        label: ui_strings.S_SWITCH_EXPAND_ALL,
        handler: this._expand_all_types.bind(this)
      },
    ];
    ContextMenu.get_instance().register("ev-listeners-all", contextmenu);
    window.messages.add_listener("setting-changed", this._onsettingchange.bind(this));
  };

  this._init(id, name, container_class);
};

cls.EventListenersView.TOKEN_FILTER = "ev-listeners-text-search";

cls.EventListenersView.prototype = ViewBase;
