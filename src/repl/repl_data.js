window.cls = window.cls || (window.cls = {});

cls.ReplData = function(view)
{
  this._repllog = [];
  this._view = view;

  this._add_entry = function(type, data)
  {
    var entry = {
      time: (new Date()).getTime(),
      type: type,
      data: data
    };

    this._repllog.push(entry);
    this._view.update();
  };

  this.add_message = function(msg)
  {
    this._add_entry("consolelog", msg);
  };

  /**
   * Input, what was typed, always a string
   */
  this.add_input = function(str)
  {
    this._add_entry("input", str);
  };

  /**
   * Anything that can be represented as a string without data loss,
   * that is, int, bool, string
   */
  this.add_output_str = function(str) {
    this._add_entry("string", str);
  };

  /**
   * Inspectableobject, as used by dir() and dirxml()
   */
  this.add_output_iobj = function(rt, objid, rootname) {
    this._add_entry("iobj", {rt_id: rt, obj_id: objid, rootname: rootname});
  };

  /**
   * Pointer to object, like when evaluating an object without using dir etc.
   */
  this.add_output_pobj = function(rt, objid, rootname)
  {
    this._add_entry("pobj", {rt_id: rt, obj_id: objid, rootname: rootname});
  };

  this.add_output_exception = function(message, trace)
  {
    this._add_entry("exception", {message:message, stacktrace:trace});
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
   * Return an array of strings that have been typed into to repl.
   * Optionally limit to entries later than the after arg.
   * Adjacent duplicates are removed, so [1,2,3,3,2] would become
   * [1,2,3,2]
   */
  this.get_typed_log = function(after)
  {
    var log = this.get_log(after).filter(function(e) {
                                        return e.type == "input";
                                      }).map(function(e) {
                                        return e.data;
                                      }).reverse();

    if (log.length)
    {
      for (var n=1; n<log.length; n++)
      {
        if (log[n] == log[n-1]) {
          log.splice(n--, 1); // yes really. roll back n so we don't skip an item.
        }
      }
    }
    return log;
  };

};
