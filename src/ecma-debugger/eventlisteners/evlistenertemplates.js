(function()
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
  var has_listeners = function(rt_l) { return rt_l.event_types.length; };

  /* Event listener view */

  this.main_ev_listener_view = function(data, search_term)
  {
    var data_with_ls = data.filter(has_listeners);
    return (
    ["div",
      ["ul", data_with_ls.map(this._ev_rt_view.bind(this, search_term)),
             "class", "ev-rt-list"],
      "class", "main-ev-listener-view js-search-results-runtime padding"]);
  };

  this._ev_rt_view = function(search_term, ev_rt, index, ev_rt_list)
  {
    var rt = window.runtimes.getRuntime(ev_rt.rt_id);
    var ret = ["li"];
    if (ev_rt_list.length > 1)
    {
      ret.push(["h2",
                 ["span", rt && (rt.title || rt.host || rt.short_url),
                          "data-tooltip", "url-tooltip",
                          "data-tooltip-text", rt && rt.uri],
                 "class", "ev-rt-title"]);
    }
    var event_types = search_term
                    ? ev_rt.event_types.filter(function(ev_type)
                      {
                        return ev_type.type.contains(search_term);
                      })
                    : ev_rt.event_types;
    ret.push(["ul", event_types.map(this._ev_type, this),
                    "data-rt-id", String(ev_rt.rt_id),
                    "data-obj-id", String(ev_rt.obj_id),
                    "class", "ev-type-list"]);
    return ret;
  };

  this._ev_type = function(ev_type)
  {
    //var bg_pos = ev_type.is_expanded ? "0 -11px" : "0 0";
    return (
    ["li",
      ["h3",
        ["input", "type", "button",
                  "class", "folder-key"],
        ev_type.type,
        "handler", "toggle-ev-listeners",
        "data-ev-type", ev_type.type,
        "class", "ev-type" + (ev_type.is_expanded ? " unfolded" : "")],
      ev_type.is_expanded ? this.ev_all_listeners(ev_type) : []]);
  };

  this.ev_all_listeners = function(ev_type)
  {
    var tmpl_obj_l = window.templates.ev_window_listeners(ev_type);
    var tmpl_node_l = window.templates.dom_search(ev_type);
    return ["div", tmpl_obj_l, [tmpl_node_l], "class", "ev-listener-list mono"];
  };

  this.ev_window_listeners = function(ev_type)
  {
    var win_listeners = ev_type && ev_type.window_listeners;
    var has_listener = function(listener)
    {
      return listener[EVENT_TYPE] == ev_type.type;
    };

    return win_listeners && win_listeners.listeners &&
           win_listeners.listeners.some(has_listener)
         ? ["div",
              "window",
              ["span", "class", "ev-listener",
                       "data-tooltip", "event-listener"],
              "data-model-id", String(ev_type.id),
              "data-window-id", String(win_listeners.win_id),
              "data-rt-id", String(ev_type.rt_id),
              "data-obj-id", String(win_listeners.win_id),
              "handler", "inspect-object-link",
              "class", "search-match"]
         : [];
  };

  /* Event listener tooltip */

  this.ev_listeners_tooltip = function(model, rt_id, node_id, listener_list, cl_name)
  {
    return ["dl", listener_list.map(this._ev_listener_tooltip.bind(this, model, rt_id, node_id)),
                  "class", cl_name];
  };

  this._ev_listener_tooltip = function(model, rt_id, node_id, listener)
  {
    var ret = [];
    var position = listener[POSITION];

    ret.push(["dt", listener[EVENT_TYPE],
               ["span", listener[USE_CAPTURE]
                      ? ui_strings.S_LISTENER_CAPTURING_PHASE
                      : ui_strings.S_LISTENER_BUBBLING_PHASE,
                        "class", "ev-phase " + (listener[USE_CAPTURE]
                                                ? "capturing-phase"
                                                : "bubbling-phase")],
              "class", "ev-type"]);
    if (listener[LISTENER_SCRIPT_DATA])
    {
      ret.push(["dd",
                  ["span", ui_strings.S_ATTRIBUTE_LISTENER,
                           "data-tooltip", "js-inspection",
                           "data-script-data", listener[LISTENER_SCRIPT_DATA],
                           "data-class-name", "Function",
                           "class", "ev-origin"]]);
    }
    else
    {
      ret.push(["dd",
                  ["span", listener[ORIGIN] == ORIGIN_EVENT_TARGET
                         ? ui_strings.S_EVENT_TARGET_LISTENER
                         : ui_strings.S_ATTRIBUTE_LISTENER,
                           "data-tooltip", "js-inspection",
                           "data-rt-id", String(rt_id),
                           "data-obj-id", String(listener[LISTENER_OBJECT_ID]),
                           "data-class-name", "Function",
                           "handler", "ev-function-source",
                           "class", "ev-origin"]]);
    }
    var script_id = position && position[SCRIPT_ID];
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      var sc_link = this.script_link_with_line_number(script,
                                                      position[LINE_NUMBER],
                                                      ui_strings.S_EVENT_LISTENER_ADDED_IN);
      if (sc_link.length)
      {
        sc_link.push("handler", "show-log-entry-source",
                     "data-scriptid", String(script_id),
                     "data-scriptline", String(position[LINE_NUMBER]),
                     "class", "ev-added");
        ret.push(["dd", sc_link]);
      }
    }
    else if (window.runtimes.is_runtime_of_reloaded_window(rt_id) &&
             model.node_has_attr(node_id, "on" + listener[EVENT_TYPE]))
    {
      ret.push(["dd", ui_strings.S_EVENT_LISTENER_SET_AS_MARKUP_ATTR,
                      "class", "ev-markup-attribute"]);
    }
    else
    {
      ret.push(["dd", ui_strings.S_INFO_MISSING_JS_SOURCE_FILE,
                      "handler", "reload-script-dialog",
                      "class", "ev-missing-script"]);
    }
    return ret;
  };

  this.script_link_with_line_number = function(script, line_number, str)
  {
    str || (str = "%s");
    var ret = [];
    var script_type = this._script_type_map[script.script_type] ||
                      script.script_type;
    if (script.uri)
    {
      var is_linked = script.script_type == "linked";
      ret.push("span", str.replace("%s", script.short_url + ":" + line_number),
                       "data-tooltip", is_linked && "url-tooltip",
                       "data-tooltip-text", is_linked && script.uri);
    }
    else
    {
      var rt = window.runtimes.getRuntime(script.runtime_id);
      if (rt)
        ret.push("span", str.replace("%s", rt.short_url),
                         "data-tooltip", "url-tooltip",
                         "data-tooltip-text", rt.uri);
      else
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                        " missing runtime in _ev_listener template.");
    }
    return ret;
  };

}).apply(window.templates || (window.templates = {}));
