(function()
{
  // TODO clean up the order an the names
  this.main_ev_listener_view = function(data)
  {
    return (
    ["div",
      ["div",
        ["span",
          ["span", "Update"], // TODO ui string
          "class" , "ui-button",
          "unselectable", "on",
          "tabindex", "1",
          "handler", "update-ev-listeners"]],
      ["ul", data.map(this._ev_names_list, this)],
      "class", "main-ev-listener-view padding"]);
  };

  this._ev_names_list = function(ev_obj, index, ev_obj_list)
  {
    return (
    ["li",
      ["ul", ev_obj.event_names.map(this._ev_name_item, this),
             "data-rt-id", String(ev_obj.rt_id),
             "data-obj-id", String(ev_obj.obj_id)]]);
  };

  this._ev_name_item = function(ev_name_obj)
  {
    return (
    ["li", 
      ["h3", 
        ["input", "type", "button",
                  "class", "folder-key"],
        ev_name_obj.name,
        "handler", "toggle-ev-listeners",
        "data-ev-name", ev_name_obj.name,
        "class", "ev-listener-type"],
      ev_name_obj.is_expanded ? this.ev_all_listeners(ev_name_obj) : []
    ]);
  };

  this.ev_listeners = function(listener_list, rt_id)
  {
    return ["dl", listener_list.map(this._ev_listener.bind(this, rt_id)),
                  "class", "ev-listener mono"];
  };

  this.ev_window_listeners = function(ev_name_object)
  {
    var EVENT_TYPE = 0;
    var model = ev_name_object.model;
    var win_listeners = model && model.window_listeners;
    var ret = [];
    if (win_listeners && win_listeners.listeners.some(function(listener)
        {
          return listener[EVENT_TYPE] == ev_name_object.name;
        }))
    {
      ret =
      ["div",
        "window",
        ["span", "class", "node-with-ev-listener", 
                 "data-tooltip", "event-listener"],
        "data-model-id", String(model.id),
        "data-window-id", String(win_listeners.win_id)];
    }
    return ret;
  };

  this.ev_all_listeners = function(ev_name_obj)
  {
    var tmpl_obj_l = window.templates.ev_window_listeners(ev_name_obj);
    var tmpl_node_l = window.templates.dom_search(ev_name_obj.model);
    return (
    ["div", 
      tmpl_obj_l, 
      [tmpl_node_l],
      "class", "ev-all-listeners"]);
  };

  this._ev_listener = function(rt_id, listener)
  {
    var EVENT_TYPE = 0;
    var ORIGIN = 1;
    var ORIGIN_EVENT_TARGET = 1;
    var ORIGIN_ATTRIBUTE = 2;
    var POSITION = 2;
    var SCRIPT_ID = 0;
    var LINE_NUMBER = 1;
    var USE_CAPTURE = 3;
    var LISTENER_OBJECT_ID = 4;
    var LISTENER_SCRIPT_DATA = 5;
    var ret = [];
    var position = listener[POSITION];

    ret.push(["dt", listener[EVENT_TYPE], "class", "ev-type"]);
    ret.push(["dd", listener[USE_CAPTURE] ? "capturing phase" : "bubbling phase",
                    "class", "ev-phase"]);
    ret.push(["dd", 
                ["span", listener[ORIGIN] == ORIGIN_EVENT_TARGET
                       ? "event target handler"
                       : "attribute handler",
                         "data-tooltip", "js-inspection",
                         "data-rt-id", String(rt_id),
                         "data-obj-id", String(listener[LISTENER_OBJECT_ID]),
                         "data-class-name", "Function",
                         "class", "ev-origin"]]);
    var script_id = position && position[SCRIPT_ID];
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      var sc_link = this.script_link_with_file_number(script,
                                                      position[LINE_NUMBER],
                                                      "added in %s"); //TODO ui string
      if (sc_link.length)
      {
        sc_link.push("handler", "show-log-entry-source",
                     "data-scriptid", String(script_id),
                     "data-scriptline", String(position[LINE_NUMBER]),
                     "class", "ev-added");
        ret.push(["dd", sc_link]);
      }
    }
    else
      ret.push(["dd", "<missing JavaScript source file>"]);  // TODO ui string

    return ret;
  };

  this.script_link_with_file_number = function(script, line_number, str)
  {
    str || (str = "%s");
    var ret = [];
    var script_type = this._script_type_map[script.script_type] ||
                      script.script_type;
    if (script.uri)
    {
      var is_linked = script.script_type == "linked";
      ret.push("span", str.replace("%s", script.filename + ":" + line_number),
                       "data-tooltip", is_linked && "url-tooltip", 
                       "data-tooltip-text", is_linked && script.uri);
    }
    else
    {
      var rt = window.runtimes.getRuntime(script.runtime_id);
      if (rt)
        ret.push("span", str.replace("%s", rt.filename),
                         "data-tooltip", "url-tooltip", 
                         "data-tooltip-text", rt.uri);
      else
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 
                        " missing runtime in _ev_listener template.");
    }
    return ret;
  };

}).apply(window.templates || (window.templates = {}));
