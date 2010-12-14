window.cls = window.cls || (window.cls = {});

cls.ReplData = function(view)
{
  this._repllog = [];
  this._typed_history = settings.command_line.get("typed-history") || [];
  this._max_typed = settings.command_line.get('max-typed-history-length') || 0;
  this._view = view;

  this.clear = function()
  {
    this._repllog = [];
    // leave the typed history alone.
    this._view.update();
  };

  this._entry_count = 0;
  this._add_entry = function(type, data)
  {
    var entry = {
      time: ++this._entry_count,
      type: type,
      data: data
    };
    this._repllog.push(entry);
    this._view.update();
  };

  /**
   * Input, what was typed, always a string
   */
  this.add_input = function(str)
  {
    this._add_typed_history(str);
    this._add_entry("input", str);
  };

  /**
   * Anything that can be represented as a string without data loss,
   * that is, int, bool, string
   */
  this.add_output_str = function(str) {
    this._add_entry("string", str);
  };

  this.add_message = this.add_output_str; // for now, just emit strings

  this.add_output_completion = function(str)
  {
    this._add_entry("completion", str);
  };

  this.add_output_errorlog = function(str)
  {
    this._add_entry("errorlog", str);
  };

  /**
   * Inspectable element, as used by dirxml()
   */
  this.add_output_iele = function(rt, objid, name)
  {
    this._add_entry("iele", {rt_id: rt, obj_id: objid, name: name});
  };

  /**
   * Inspectableobject, as used by dir()
   */
  this.add_output_iobj = function(rt, objid, name) {
    this._add_entry("iobj", {rt_id: rt, obj_id: objid, name: name});
  };

  /**
   * Pointer to object, like when evaluating an object without using dir etc.
   */
  this.add_output_pobj = function(rt, objid, name)
  {
    this._add_entry("pobj", {rt_id: rt, obj_id: objid, name: name});
  };

  this.add_output_valuelist = function(rt, values)
  {
    this._add_entry("valuelist", values);
  };

  this.add_output_exception = function(message, trace)
  {
    this._add_entry("exception", {message:message, stacktrace:trace});
  };

  this.add_output_trace = function(trace)
  {
    this._add_entry("trace", trace);
  };

  this.add_output_groupstart = function(data)
  {
    data.id = String(new Date().getTime());
    this._add_entry("groupstart", data);
  };

  this.add_output_groupend = function(data)
  {
    this._add_entry("groupend", data);
  };

  this.add_output_count = function(count, label)
  {
    this._add_entry("count", {count: count, label: label});
  };

  /**
   * Return a n array of entry objects for the repl input/output history.
   */
  this.get_log = function(after)
  {
    after = after || 0;
    var filterfun = function(e) { return e.time > after; };
    return this._repllog.filter(filterfun);
  };

  /**
   * Return the entry for the groupopen with a particular id
   */
  this.get_group = function(id)
  {
    var match = this._repllog.filter(function(e) {return e.data && e.data.id == id; });
    if (match.length)
    {
      return match[0].data;
    }
    else
    {
      return null;
    }
  };

  /**
   * Return an array of strings that have been typed into to repl.
   * Adjacent duplicates are removed, so [1,2,3,3,2] would become
   * [1,2,3,2]
   */
  this.get_typed_history = function()
  {
    return this._typed_history;
  };

  this._add_typed_history = function(str)
  {
    if (this._typed_history[0] != str && str.trim() !== "")
    {
      this._typed_history.unshift(str);
      if (this._max_typed && this._typed_history.length > this._max_typed)
      {
        this._typed_history = this._typed_history.slice(0, this._max_typed);
      }
      settings.command_line.set("typed-history", this._typed_history);
    }
  };

  this._on_setting_change_bound = function(msg)
  {
    if (msg.id == "repl" && msg.key == "max-typed-history-length")
    {
      this._max_typed = settings.command_line.get(msg.key);
    }
  }.bind(this);

  messages.addListener("setting-changed", this._on_setting_change_bound);
};
