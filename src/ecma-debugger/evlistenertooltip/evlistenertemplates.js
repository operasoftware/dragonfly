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
    var USE_CAPTURE = 3;
    var LISTENER_OBJECT_ID = 4;
    var LISTENER_SCRIPT_DATA = 5;

    var ret = [];
    var row = 
    ["tr",
      ["td",
        ["h2", listener[EVENT_TYPE], "class", "evl-type"]],
      ["td", listener[USE_CAPTURE] ? "capturing phase" : "bubbling phase"]];
    ret push(row);
    return ret;

  }

}).apply(window.templates || (window.templates = {}));