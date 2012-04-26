(function()
{
  this.ev_listeners = function(listener_list)
  {
    return ["table", ["tbody", listener_list.map(this._ev_listener, this)]];
  };

  this._ev_listener = function(listener)
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

    /*
      matchReason: TRAVERSAL (1)
      pseudoElementList:
      eventListenerList:
        eventener:
          eventType: "click"
          origin: EVENT_TARGET (1)
          position:
            scriptID: 2544
            lineNumber: 19
          useCapture: 0
          listenerObjectID: 17
    */

    var ret = [];
    var row = 
    ["tr",
      ["td",
        ["h2", listener[EVENT_TYPE], "class", "ev-type"]],
      ["td", listener[USE_CAPTURE] ? "capturing phase" : "bubbling phase"]];
    ret.push(row);
    row =
    ["tr",
      ["td", listener[ORIGIN] == ORIGIN_EVENT_TARGET ? 
             "event target handler" :
             "attribute handler",
             "colspan", "2", "class", "ev-origin"]];
    ret.push(row);
    var position = listener[POSITION];
    var script_id = position && position[SCRIPT_ID];
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      row =
      ["tr",
        ["td", "added:"],
        this.ev_script_link(script, position[LINE_NUMBER]),
        "handler", "show-log-entry-source",
        "data-scriptid", String(script_id),
        "data-scriptline", String(position[LINE_NUMBER]),
        "class", "ev-added"];
      ret.push(row);
    }
    return ret;
  };

  this.ev_script_link = function(script, line_number)
  {
    var script_type = this._script_type_map[script.script_type] ||
                      script.script_type;
    if (script.uri)
    {
      var is_linked = script.script_type == "linked";
      var ret = 
      ["td", 
        ["span", script.filename + ":" + line_number, 
                 "data-tooltip", is_linked && "js-script-select", 
                 "data-tooltip-text", is_linked && script.uri,
                 "class", "file-line"]];
    }
    else
    {
      var rt = window.runtimes.getRuntime(script.runtime_id);
      if (rt)
      {
        var ret = 
        ["td", 
          ["span", rt.filename + ":" + line_number,
                   "data-tooltip", "js-script-select", 
                   "data-tooltip-text", rt.uri,
                   "class", "file-line"]];
      }
    }

    ret.push("script-id", String(script.script_id));
    return ret;
  };

}).apply(window.templates || (window.templates = {}));