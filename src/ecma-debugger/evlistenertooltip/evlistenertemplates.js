(function()
{
  this.ev_listeners = function(listener_list, rt_id)
  {
    return ["dl", listener_list.map(this._ev_listener.bind(this, rt_id)),
                  "class", "ev-listener"]; // , this), "class", "ev-listener"];
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
    var position = listener[POSITION];
    var script_id = position && position[SCRIPT_ID];
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      var script_type = this._script_type_map[script.script_type] ||
                        script.script_type;
      var ctx = [];
      if (script.uri)
      {
        var is_linked = script.script_type == "linked";
        ctx.push("span", "added in " + script.filename + ":" + position[LINE_NUMBER], // TODO ui string
                         "data-tooltip", is_linked && "url-tooltip", 
                         "data-tooltip-text", is_linked && script.uri);
      }
      else
      {
        var rt = window.runtimes.getRuntime(script.runtime_id);
        if (rt)
          ctx.push("span", "added in " + rt.filename, // TODO ui string
                           "data-tooltip", "url-tooltip", 
                           "data-tooltip-text", rt.uri);
        else
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 
                          " missing runtime in _ev_listener template.");
      }

      if (ctx.length)
      {
        ctx.push("handler", "show-log-entry-source",
                 "data-scriptid", String(script_id),
                 "data-scriptline", String(position[LINE_NUMBER]),
                 "class", "ev-added");
        ret.push(["dd", ctx]);
      }
    }
    else
      ret.push(["dd", "<missing JavaScript source file>"]);  // TODO ui string

    return ret;
  };

}).apply(window.templates || (window.templates = {}));
