window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.SelectedNodeListenersView = function(id, name, container_class)
{
  var tmpl_no_content = ["div", ui_strings.S_NO_EVENT_LISTENER,
                                "class", "not-content padding"];

  this.createView = function(container)
  {
    var sel_ele = this._selected_ele;
    var tmpl = tmpl_no_content;
    if (sel_ele && sel_ele.model)
    {
      var listeners = sel_ele.model.get_ev_listeners(sel_ele.obj_id);
      if (listeners && listeners.length)
      {
        tmpl = window.templates.ev_listeners_tooltip(sel_ele.model,
                                                     sel_ele.rt_id,
                                                     sel_ele.obj_id,
                                                     listeners,
                                                     "list-selected-node");
      }
    }
    container.clearAndRender(tmpl);
  };

  this._on_element_selected = function(msg)
  {
    this._selected_ele = msg;
    this.update();
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._selected_ele = null;
    window.messages.add_listener("element-selected", this._on_element_selected.bind(this));
  };

  this._init(id, name, container_class);
};

cls.SelectedNodeListenersView.prototype = ViewBase;
